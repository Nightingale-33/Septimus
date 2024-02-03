import { Prefecture } from "../Prefecture Level/Prefecture";
import { log } from "../utils/Logging/Logger";
import { defaultsDeep, filter, flatten } from "lodash";
import { Delegation } from "../lib/Delegation";
import { Profile } from "../utils/Profiler/SimpleProfile";
import { Empire } from "../Empire Level/Empire";
import { Spawner } from "./Delegations/Spawner";
import { MiningSiteAssigner } from "./Delegations/MiningSiteAssigner";
import { Mission } from "../lib/Mission/Mission";
import { Role } from "../lib/Roles/Role";
import { TRACE_FLAG } from "../utils/Logging/FlagDecs";
import { IdleAction } from "../lib/Actions/Creep/Action.Idle";
import { LogisticsManager } from "./Delegations/LogisticsManager";
import { MiningMission } from "./Missions/MiningMission";
import { BuildingManager } from "./Delegations/BuildingManager";

declare global {
  interface ProvinceMemory
  {
    AttachedPrefectures: string[];
  }

  interface CreepMemory
  {
    Province: string;
    assignmentId: string | undefined;
    assignmentPriority: number | undefined;
  }
}

const defaultsProvinceMemory : ProvinceMemory = {
  AttachedPrefectures: [],
}

export class Province {
  Empire: Empire;

  ActiveMissions: {[id: string] : Mission} = {};
  get MiningSites() : MiningMission[] { return global.cache.UseValue(() => Object.values(this.ActiveMissions).filter((m) : m is MiningMission => m instanceof MiningMission),0,`${this.name+"_MiningSites"}`); }

  Prefectures: Prefecture[];
  Capital: Prefecture;

  get memory() : ProvinceMemory {
    if(this.Empire.memory.Provinces[this.name] === undefined)
    {
      this.Empire.memory.Provinces[this.name] = defaultsProvinceMemory;
    }
    return this.Empire.memory.Provinces[this.name];
  }

  get Delegations(): Delegation[] {return this.GeneralDelegations.concat([this.MiningMan,this.Logistics,this.Spawning]);};
  Spawning: Spawner;
  MiningMan: MiningSiteAssigner;
  Logistics: LogisticsManager;
  GeneralDelegations: Delegation[] = [];

  Initialised : boolean = false;

  get creeps() : Creep[] {
    return global.cache.UseValue(() => filter(Game.creeps, (c) => c.memory.Province === this.name),0,"Prov"+this.name+"Creeps");
  }

  get sources() : Source[] {
    return global.cache.UseValue(() => flatten(this.Prefectures.map((p) => p.sources)),100,"Prov"+this.name+"Sources");
  }
  get spawns() : StructureSpawn[] {
    return global.cache.UseValue(() => flatten(this.Prefectures.map((p) => p.room.find(FIND_MY_SPAWNS))), 50, "Prov"+this.name+"Spawns");
  }

  get storage() : StructureStorage | null {
    return this.Capital.room.storage ?? null;
  }

  get name() : string {
    return this.Capital.RoomName;
  }

  constructor(empire: Empire,provinceCapitalRoomName: string) {
    this.Empire = empire;
    this.Capital = new Prefecture(this,provinceCapitalRoomName);
    this.Prefectures = [this.Capital];
    defaultsDeep(this.memory,defaultsProvinceMemory);
  }

  Initialise()
  {
    if(!this.memory.AttachedPrefectures)
    {
      this.memory.AttachedPrefectures = [];
    }

    for(const attachedName of this.memory.AttachedPrefectures) {
      this.Prefectures.push(new Prefecture(this,attachedName));
    }

    for(const prefecture of this.Prefectures)
    {
      prefecture.Initialise();
    }

    this.MiningMan = new MiningSiteAssigner(this);
    this.Spawning = new Spawner(this);
    this.Logistics = new LogisticsManager(this);
    this.GeneralDelegations.push(new BuildingManager(this));

    this.Initialised = true;
    log(1,`Province at: ${this.Capital.RoomName} Initialised`);
  }

  Run()
  {
    for(const delegation of this.Delegations)
    {
      Profile(delegation.name,() => {
        if(delegation.ShouldExecute())
        {
          delegation.Execute();
        }
      });
    }

    for(const mFlag in this.ActiveMissions)
    {
      let mission = this.ActiveMissions[mFlag];
      Profile(mFlag, () => {
        mission.run();
      });
    }

    for(const prefecture of this.Prefectures)
    {
      Profile(prefecture.RoomName,() => {
        prefecture.Run();
      })
    }
  }

  Tidy()
  {
    for(const missionFlag in this.ActiveMissions)
    {
      if(!Game.flags[missionFlag])
      {
        log(3,`Mission Flag: ${missionFlag} is no longer active`);
        delete this.ActiveMissions[missionFlag];
      }
    }

    for(const creep of this.creeps)
    {
      if(creep.memory.plan.isEmpty() && creep.memory.assignmentId !== undefined)
      {
        log(1,`Creep: ${creep.name} was idle and is thus having its assignment cleared`);
        delete creep.memory.assignmentId;
      }
    }
  }

  RequestCreeps(role: Role, amount: number, requestId : string, requestPriority: number, deRegisterExcess : boolean = true, requestSpawn : boolean = true) : Creep[]
  {
    //Gather pre-assigned
    let assignedCreeps : Creep[] = this.creeps.filter((c) => c.memory.assignmentId === requestId);;
    if(deRegisterExcess && assignedCreeps.length > amount)
    {
      //Trim the excess
      assignedCreeps.slice(amount).forEach((c) => delete c.memory.assignmentId);
      assignedCreeps = assignedCreeps.slice(0,amount);
    }

    //All done
    if(assignedCreeps.length >= amount)
    {
      return assignedCreeps;
    }

    //Claim existing
    while (assignedCreeps.length < amount) {
      let unassignedCreep = this.creeps.find((c) =>
        c.memory.role === role && c.memory.assignmentId === undefined);
      if (unassignedCreep) {
        assignedCreeps.push(unassignedCreep);
        unassignedCreep.memory.assignmentId = requestId;
        unassignedCreep.memory.assignmentPriority = requestPriority;
        log(1, `Claiming ${unassignedCreep.memory.role}: ${unassignedCreep.name} in ${this.name}`);
      } else {
        let lessBusyCreep = this.creeps.find((c) =>
        c.memory.role === role && (c.memory.assignmentPriority ?? 0) < requestPriority);
        if(lessBusyCreep) {
          assignedCreeps.push(lessBusyCreep);
          lessBusyCreep.memory.assignmentId = requestId;
          lessBusyCreep.memory.assignmentPriority = requestPriority;
          log(1, `Claiming Pre-Assigned ${lessBusyCreep.memory.role}: ${lessBusyCreep.name} in ${this.name}`);
        } else
        {
          log(TRACE_FLAG,`Unable to find free ${role} in ${this.name}`);
          break;
        }
      }
    }

    //

    //Acquired enough
    if(assignedCreeps.length >= amount || !requestSpawn)
    {
      return assignedCreeps;
    }

    //Put in Spawn Requests
    //Request additional
    let difference = amount - assignedCreeps.length;
    if (difference < 1) {
      throw new Error("Somehow got to Spawn Requests without needing any");
    }
    this.Spawning.RequestCreepSpawn(role, requestId, requestPriority);

    return assignedCreeps;
  }
}
