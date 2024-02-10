import { Province } from "../../Province Level/Province";
import { GetCreepMemory, SpawnCreep } from "../../utils/SpawnUtils";

export const SCOUT = "Scout";

export function SpawnScout(spawn: StructureSpawn, province: Province) : string | null
{
  const baseBody = [MOVE];
  return SpawnCreep(spawn, baseBody, GetCreepMemory(SCOUT,province.name));
}
