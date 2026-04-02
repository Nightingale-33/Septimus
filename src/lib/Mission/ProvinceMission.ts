import { Mission, MissionMemory } from "./Mission";
import { Province } from "../../Province Level/Province";
import { Role } from "../Roles/Role";
import { log } from "../../utils/Logging/Logger";

export abstract class ProvinceMission extends Mission {
  province: Province;

  abstract priority: number;

  constructor(flag: Flag, province: Province, Id: string) {
    super(flag,Id);
    this.province = province;
  }
}
