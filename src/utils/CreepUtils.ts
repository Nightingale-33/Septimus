import { countBy } from "lodash";

export function CountParts(creep : Creep) {
  return countBy(creep.body,(bpd) => bpd.type);
}
