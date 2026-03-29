import { Prefecture } from "../Prefecture Level/Prefecture";
import { log } from "../utils/Logging/Logger";
import { any, defaultsDeep, filter, flatten, remove, sum } from "lodash";
import { Delegation } from "../lib/Delegation";
import { Profile } from "../utils/Profiler/SimpleProfile";
import { Empire } from "../Empire Level/Empire";
import { Spawner } from "./Delegations/Spawner";
import { MiningSiteAssigner } from "./Delegations/MiningSiteAssigner";
import { Mission } from "../lib/Mission/Mission";
import { Role } from "../lib/Roles/Role";
import { TRACE_FLAG } from "../utils/Logging/FlagDecs";
import { IdleAction } from "../lib/Actions/Creep/Action.Idle";
import { EnergyLogisticsManager } from "./Delegations/EnergyLogisticsManager";
import { MiningMission } from "./Missions/MiningMission";
import { BuildingManager } from "./Delegations/BuildingManager";
import { CountParts } from "../utils/CreepUtils";
import { BaseLocationDecider } from "../Prefecture Level/RoomPlanning/BaseLocationDecider";
import { RepairingManager } from "./Delegations/MaintenanceManager";
import { RoadBuilder } from "./Delegations/RoadBuilder";
import { PrefectureAcquirer } from "./Delegations/PrefectureAcquirer";
import { TerminalDelegation } from "./Delegations/TerminalDelegation";
import { SpawnRefiller } from "./Delegations/SpawnRefiller";

declare global {
  interface ProvinceMemory {
    AttachedPrefectures: string[];
    FocalPoint?: RoomPosition
  }

  interface CreepMemory {
    Province: string;
    assignmentId: string | undefined;
    assignmentPriority: number | undefined;
  }
}

export interface CreepRequestOptions {
  deRegisterExcess?: boolean,
  requestSpawn?: boolean,
  spawnRoleSelector?: (roles: Role[]) => Role,
  spawnPredicate?: (province: Province) => boolean,
  maxCreeps?: number,
  stealCreeps?: boolean,
  stopIfIdle? : boolean,
  clearPlan? : boolean
}

export const defaultCreepRequestOptions: CreepRequestOptions = {
  deRegisterExcess: true,
  requestSpawn: true,
  spawnRoleSelector: (roles) => roles[0],
  spawnPredicate: (province) => province.Capital.room.energyAvailable >= 300 && (province.Capital.room.energyAvailable / province.Capital.room.energyCapacityAvailable) >= 0.75,
  maxCreeps: Infinity,
  stealCreeps: false,
  stopIfIdle: true,
  clearPlan: true
};

const defaultsProvinceMemory: ProvinceMemory = {
  AttachedPrefectures: [],
};

export class Province {
  Empire: Empire;

  ActiveMissions: { [id: string]: Mission } = {};

  get MiningSites(): MiningMission[] {
    return global.cache.UseValue(() => Object.values(this.ActiveMissions).filter((m): m is MiningMission => m instanceof MiningMission), 0, `${this.name + "_MiningSites"}`);
  }

  Prefectures: Prefecture[];
  Capital: Prefecture;

  get memory(): ProvinceMemory {
    if (this.Empire.memory.Provinces[this.name] === undefined) {
      this.Empire.memory.Provinces[this.name] = defaultsProvinceMemory;
    }
    return this.Empire.memory.Provinces[this.name];
  }

  get Delegations(): Delegation[] {
    return this.GeneralDelegations.concat([this.MiningMan, this.Logistics, this.Spawning, this.Building, this.Repairing, this.Roads]);
  };

  get FocalPoint(): RoomPosition | undefined {
    return this.memory.FocalPoint;
  }

  Spawning: Spawner;
  MiningMan: MiningSiteAssigner;
  Logistics: EnergyLogisticsManager;
  Building : BuildingManager;
  Repairing : RepairingManager;
  Roads : RoadBuilder;
  GeneralDelegations: Delegation[] = [];

  Initialised: boolean = false;

  get creeps(): Creep[] {
    return global.cache.UseValue(() => filter(Game.creeps, (c) => c.memory.Province === this.name), 0, "Prov" + this.name + "Creeps");
  }

  get sources(): Source[] {
    return global.cache.UseValue(() => flatten(this.Prefectures.map((p) => p.sources)), 5, "Prov" + this.name + "Sources");
  }

  get structures() : Structure[] {
    return global.cache.UseValue(() => flatten(this.Prefectures.map((p) => p.structures)), 0, "Prov" + this.name + "Structures");
  }

  get spawns(): StructureSpawn[] {
    return global.cache.UseValue(() => flatten(this.structures.filter((s) : s is StructureSpawn => s instanceof StructureSpawn)), 0, "Prov" + this.name + "Spawns");
  }

  get storage(): StructureStorage | null {
    return this.Capital.room.storage ?? null;
  }

  get name(): string {
    return this.Capital.RoomName;
  }

  constructor(empire: Empire, provinceCapitalRoomName: string) {
    this.Empire = empire;
    this.Capital = new Prefecture(this, provinceCapitalRoomName);
    this.Prefectures = [this.Capital];
    defaultsDeep(this.memory, defaultsProvinceMemory);
  }

  Initialise() {
    if (!this.memory.AttachedPrefectures) {
      this.memory.AttachedPrefectures = [];
    }

    for (const attachedName of this.memory.AttachedPrefectures) {
      this.Prefectures.push(new Prefecture(this, attachedName));
    }

    for (const prefecture of this.Prefectures) {
      prefecture.Initialise();
    }

    this.MiningMan = new MiningSiteAssigner(this);
    this.Spawning = new Spawner(this);
    this.Logistics = new EnergyLogisticsManager(this);
    this.Building = new BuildingManager(this);
    this.Repairing = new RepairingManager(this);
    this.Roads = new RoadBuilder(this);

    this.GeneralDelegations.push(new PrefectureAcquirer(this));
    this.GeneralDelegations.push(new SpawnRefiller(this));
    this.GeneralDelegations.push(new TerminalDelegation(this));

    this.Capital.GeneralDelegations.push(new BaseLocationDecider(this, this.Capital));

    this.Initialised = true;
    log(1, `Province at: ${this.Capital.RoomName} Initialised`);
  }

  Run() {
    for (const prefecture of this.Prefectures) {
      Profile(`Prefecture ${prefecture.RoomName}`, () => {
        if(!prefecture.Initialised)
        {
          prefecture.Initialise();
        }
        prefecture.Run();
      });
    }

    for (const delegation of this.Delegations) {
      Profile(`Delegation: ${delegation.name}`, () => {
        if (delegation.ShouldExecute()) {
          delegation.Execute();
        }
      });
    }

    for (const mFlag in this.ActiveMissions) {
      let mission = this.ActiveMissions[mFlag];
      Profile(`Mission Flag: ${mFlag}`, () => {
        mission.run();
      });
    }
  }

  Tidy() {
    for (const missionFlag in this.ActiveMissions) {
      if (!Game.flags[missionFlag]) {
        log(3, `Mission Flag: ${missionFlag} is no longer active`);
        delete this.ActiveMissions[missionFlag];
      }
    }

    // for (const creep of this.creeps) {
    //   if (creep.memory.plan.isEmpty() && creep.memory.assignmentId !== undefined) {
    //     log(1, `Creep: ${creep.name} was idle and is thus having its assignment cleared`);
    //     this.UnassignCreep(creep);
    //   }
    // }
  }

  UnassignCreep(creep: Creep) {
    log(3,`Unassigning Creep: ${creep.name} from ${creep.memory.assignmentId}`);
    delete creep.memory.assignmentId;
    delete creep.memory.assignmentPriority;
    creep.memory.plan.clear(creep);
  }

  RequestCreeps(role: Role, amount: number, requestId: string, requestPriority: number, opts: CreepRequestOptions = defaultCreepRequestOptions): Creep[] {
    let options: CreepRequestOptions = defaultsDeep(opts, defaultCreepRequestOptions);

    if(requestId.length === 0)
    {
      throw new Error(`Empty Request Id for ${role}`);
    }

    //Gather pre-assigned
    let assignedCreeps: Creep[] = this.creeps.filter((c) => c.memory.assignmentId === requestId);
    if (options.deRegisterExcess && assignedCreeps.length > amount) {
      //Trim the excess
      assignedCreeps.slice(amount).forEach((c) => this.UnassignCreep(c));
      assignedCreeps = assignedCreeps.slice(0, amount);
    }

    //All done
    if (assignedCreeps.length >= amount || (options.stopIfIdle && any(assignedCreeps, (c) => c.memory.plan.peek() instanceof IdleAction))) {
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
        if(options.clearPlan)
        {
          unassignedCreep.memory.plan.clear(unassignedCreep);
        }
        log(1, `Claiming ${unassignedCreep.memory.role}: ${unassignedCreep.name} in ${this.name} for: ${requestId}`);
      } else {
        let lessBusyCreep = this.creeps.find((c) =>
          c.memory.role === role && c.memory.assignmentId !== requestId && (c.memory.assignmentPriority ?? 0) < requestPriority);
        if (lessBusyCreep) {
          assignedCreeps.push(lessBusyCreep);
          lessBusyCreep.memory.assignmentId = requestId;
          lessBusyCreep.memory.assignmentPriority = requestPriority;
          if(options.clearPlan)
          {
            lessBusyCreep.memory.plan.clear(lessBusyCreep);
          }
          log(1, `Claiming Pre-Assigned ${lessBusyCreep.memory.role}: ${lessBusyCreep.name} in ${this.name} for: ${requestId}`);
        } else {
          log(TRACE_FLAG, `Unable to find free ${role} in ${this.name}`);
          break;
        }
      }
    }

    //

    //Acquired enough
    if (assignedCreeps.length >= amount || !options.requestSpawn) {
      if(options.requestSpawn)
      {
        log(3,"Removing existing spawn requests");
        remove(this.Spawning.SpawnRequests, (s) => s.id === requestId && s.role === role);
      }
      return assignedCreeps;
    }

    //Put in Spawn Requests
    //Request additional
    let difference = Math.ceil(amount - assignedCreeps.length);
    if (difference < 1) {
      throw new Error(`Somehow got to Spawn Requests without needing any: ${amount}, ${assignedCreeps.length}, ${difference}`);
    }
    if (options.spawnPredicate!(this)) {
      this.Spawning.RequestCreepSpawn(role, requestId, requestPriority);
    } else {
      log(3, `Failed Spawn Predicate for request from ${requestId}`);
      remove(this.Spawning.SpawnRequests, (s) => s.id === requestId && s.role === role);
    }

    return assignedCreeps;
  }

  RequestParts(usableRoles: Role[], part: BodyPartConstant, amount: number, requestId: string, requestPriority: number, opts: CreepRequestOptions = defaultCreepRequestOptions): Creep[] {
    let options: CreepRequestOptions = defaultsDeep(opts, defaultCreepRequestOptions);

    if(requestId.length === 0)
    {
      throw new Error(`Empty Request Id for ${JSON.stringify(usableRoles)}`);
    }
    if (usableRoles.length === 0) {
      throw new Error("0 Roles designated when requesting by parts");
    }
    let countPart = (creeps: Creep[]) => sum(creeps, (c) => CountParts(c)[part]);
    //Gather pre-assigned
    let assignedCreeps: Creep[] = this.creeps.filter((c) => c.memory.assignmentId === requestId)
      .sort((a, b) => CountParts(b)[part] - CountParts(a)[part]);
    if (options.deRegisterExcess && (countPart(assignedCreeps) > amount || assignedCreeps.length > options.maxCreeps!)) {
      let keptCreepNumber = 1;
      let keptCreeps = assignedCreeps.slice(0, keptCreepNumber);
      while (countPart((keptCreeps = assignedCreeps.slice(0, keptCreepNumber))) < amount && keptCreeps.length < options.maxCreeps!) {
        keptCreepNumber++;
      }
      if (keptCreepNumber < assignedCreeps.length) {
        //Trim the excess
        assignedCreeps.slice(keptCreepNumber).forEach((c) => this.UnassignCreep(c));
        assignedCreeps = assignedCreeps.slice(0, keptCreepNumber);
      }

    }

    //All done
    if (countPart(assignedCreeps) >= amount || assignedCreeps.length >= options.maxCreeps!  || (options.stopIfIdle && any(assignedCreeps, (c) => c.memory.plan.peek() instanceof IdleAction))) {
      return assignedCreeps;
    }

    //Claim existing
    while (countPart(assignedCreeps) < amount && assignedCreeps.length < options.maxCreeps!) {
      let unassignedCreep = this.creeps.find((c) =>
        usableRoles.includes(c.memory.role) && c.memory.assignmentId === undefined);
      if (unassignedCreep) {
        assignedCreeps.push(unassignedCreep);
        unassignedCreep.memory.assignmentId = requestId;
        unassignedCreep.memory.assignmentPriority = requestPriority;
        log(1, `Claiming ${unassignedCreep.memory.role}: ${unassignedCreep.name} in ${this.name} for: ${requestId}`);
      } else if (options.stealCreeps) {
        let lessBusyCreep = this.creeps.find((c) =>
          usableRoles.includes(c.memory.role) && c.memory.assignmentId !== requestId && (c.memory.assignmentPriority ?? 0) < requestPriority);
        if (lessBusyCreep) {
          assignedCreeps.push(lessBusyCreep);
          lessBusyCreep.memory.assignmentId = requestId;
          lessBusyCreep.memory.assignmentPriority = requestPriority;
          log(1, `Claiming Pre-Assigned ${lessBusyCreep.memory.role}: ${lessBusyCreep.name} in ${this.name} for: ${requestId}`);
        } else {
          log(TRACE_FLAG, `Unable to find free Creep in ${this.name}`);
          break;
        }
      } else {
        log(TRACE_FLAG, `Unable to find free Creep in ${this.name}`);
        break;
      }
    }

    //

    //Acquired enough
    let spawnRole = options.spawnRoleSelector!(usableRoles);
    if (countPart(assignedCreeps) >= amount || assignedCreeps.length >= options.maxCreeps! || !options.requestSpawn) {
      if(options.requestSpawn)
      {
        log(3,"Removing existing spawn requests");
        remove(this.Spawning.SpawnRequests, (s) => s.id === requestId && s.role === spawnRole);
      }
      return assignedCreeps;
    }

    //Put in Spawn Requests
    //Request additional
    let difference = Math.ceil(amount - countPart(assignedCreeps));
    if (difference < 1) {
      throw new Error(`Somehow got to Spawn Requests without needing any: ${difference}`);
    }
    if (options.spawnPredicate!(this)) {
      this.Spawning.RequestCreepSpawn(spawnRole, requestId, requestPriority);
    } else {
      log(3, `Failed Spawn Predicate for request from ${requestId}`);
      remove(this.Spawning.SpawnRequests, (s) => s.id === requestId && s.role === spawnRole);
    }

    return assignedCreeps;
  }
}
