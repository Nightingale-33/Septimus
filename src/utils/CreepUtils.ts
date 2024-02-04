import { countBy } from "lodash";
import { AbstractCreep } from "../lib/Planning/AbstractCreep";

export function CountParts(creep : Creep | AbstractCreep) {
  return countBy(creep.body,(bpd) => bpd.type);
}
