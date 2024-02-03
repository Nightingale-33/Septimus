import { Mission, MissionMemory } from "./Mission";
import { Province } from "../../Province Level/Province";
import { Role } from "../Roles/Role";
import { log } from "../../utils/Logging/Logger";

export interface ProvinceMissionMemory extends MissionMemory {
}

export abstract class ProvinceMission extends Mission {

  memory: ProvinceMissionMemory;
  province: Province;

  abstract priority: number;

  constructor(flag: Flag, province: Province) {
    super(flag);
    this.province = province;
  }
}
