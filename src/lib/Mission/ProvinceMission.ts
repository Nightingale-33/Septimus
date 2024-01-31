import { Mission, MissionMemory } from "./Mission";
import { Province } from "../../Province Level/Province";
import { Role } from "../Roles/Role";
import { log } from "../../utils/Logging/Logger";

export interface ProvinceMissionMemory extends MissionMemory {
  assignedCreeps: Id<Creep>[];
}

export abstract class ProvinceMission extends Mission {

  memory: ProvinceMissionMemory;
  province: Province;

  abstract priority: number;

  constructor(flag: Flag, province: Province) {
    super(flag);
    this.province = province;
    if (!this.memory.assignedCreeps) {
      this.memory.assignedCreeps = [];
    }
  }

  RequestCreeps(requests: { [id: string]: number }): { [id: string]: Creep[] } {
    let availableCreeps: { [id: string]: Creep[] } = {};
    for (const role in requests) {
      availableCreeps[role] = [];
    }
    //Gather pre-assigned
    let assigned = this.province.creeps.filter((c) => c.memory.missionId === this.memory.Id);
    for (const c of assigned) {
      if(!availableCreeps[c.memory.role])
      {
        availableCreeps[c.memory.role] = [];
      }
      //log(1,`Available: ${c.name}`);
      availableCreeps[c.memory.role].push(c);
    }
    for (const roleRequest in requests) {
      let needed = requests[roleRequest];
      //Claim existing
      while (availableCreeps[roleRequest].length < needed) {
        let unassignedCreep = this.province.creeps.find((c) =>
          c.memory.role === roleRequest && c.memory.missionId === undefined);
        if (unassignedCreep) {
          this.memory.assignedCreeps.push(unassignedCreep.id);
          unassignedCreep.memory.missionId = this.memory.Id;
          availableCreeps[roleRequest].push(unassignedCreep);
          log(1, `Claiming ${unassignedCreep.memory.role}: ${unassignedCreep.name}`);
        } else {
          break;
        }
      }

      //Request additional
      let difference = needed - availableCreeps[roleRequest].length;
      if (difference < 1) {
        //None needed
        //log(1,"None needed");
        continue;
      }
      log(1,`Needed: ${difference}`);
      this.province.RequestCreep(roleRequest as Role, this.memory.Id,this.priority);
    }
    return availableCreeps;
  }
}
