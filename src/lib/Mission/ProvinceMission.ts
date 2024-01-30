import { Mission } from "./Mission";
import { Province } from "../../Province Level/Province";

export abstract class ProvinceMission extends Mission {

  province: Province;

  constructor(flag:Flag,province: Province) {
    super(flag);
    this.province = province;
  }
}
