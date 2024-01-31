import { Prefecture } from "../Prefecture Level/Prefecture";
import { log } from "../utils/Logging/Logger";
import { defaultsDeep, filter, flatten } from "lodash";
import { Delegation } from "../lib/Delegation";
import { Profile } from "../utils/Profiler/SimpleProfile";
import { Empire } from "../Empire Level/Empire";
import { Spawner } from "./Spawner";
import { MiningSiteAssigner } from "./MiningSiteAssigner";
import { Mission } from "../lib/Mission/Mission";
import { Role } from "../lib/Roles/Role";

declare global {
  interface ProvinceMemory
  {
    AttachedPrefectures: string[];
  }

  interface CreepMemory
  {
    Province: string;
  }
}

const defaultsProvinceMemory : ProvinceMemory = {
  AttachedPrefectures: [],
  SpawnRequests: []
}

export class Province {
  Empire: Empire;

  ActiveMissions: {[id: string] : Mission} = {};

  Prefectures: Prefecture[];
  Capital: Prefecture;

  get memory() : ProvinceMemory {
    if(this.Empire.memory.Provinces[this.name] === undefined)
    {
      this.Empire.memory.Provinces[this.name] = defaultsProvinceMemory;
    }
    return this.Empire.memory.Provinces[this.name];
  }

  Delegations: Delegation[] = [];

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

    this.Delegations.push(new MiningSiteAssigner(this));
    this.Delegations.push(new Spawner(this));

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
  }

  RequestCreep(role: Role,requesterId:string, priority:number = 1)
  {
    if(!this.memory.SpawnRequests.find((r) => r.id === requesterId && r.role === role))
    {
      log(1,`Requesting ${role} for: ${requesterId}`);
      this.memory.SpawnRequests.push({id: requesterId,role:role,priority:priority,inProgress: undefined});
    }
  }
}
