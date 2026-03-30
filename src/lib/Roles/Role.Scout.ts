import { Province } from "../../Province Level/Province";
import { GetCreepMemory, GetLargestBody, SpawnCreep } from "../../utils/SpawnUtils";

export const SCOUT = "Scout";

export function SpawnScout(spawn: StructureSpawn, province: Province) : string | null
{
  const baseBody = [MOVE];
  const bodyAddon = [TOUGH];

  let largestBody = GetLargestBody(spawn, baseBody, bodyAddon);
    if (largestBody.length == 0) {
      return null;
    }

  return SpawnCreep(spawn, largestBody, GetCreepMemory(SCOUT,province.name));
}
