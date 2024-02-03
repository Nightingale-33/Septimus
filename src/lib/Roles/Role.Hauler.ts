import { Province } from "../../Province Level/Province";
import { GetCreepMemory, GetLargestBody, SpawnCreep } from "../../utils/SpawnUtils";

export const HAULER = "Hauler";

export function SpawnHauler(spawn: StructureSpawn, province: Province) : string | null
{
  const baseBody = [CARRY, MOVE];
  const bodyAddon = [CARRY];

  let largestBody = GetLargestBody(spawn, baseBody, bodyAddon, 6,true);
  if (largestBody.length == 0) {
    return null;
  }
  return SpawnCreep(spawn, largestBody, GetCreepMemory(HAULER,province.name));
}
