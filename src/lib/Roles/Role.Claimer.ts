import { Province } from "../../Province Level/Province";
import { GetCreepMemory, GetLargestBody, SpawnCreep } from "../../utils/SpawnUtils";

export const CLAIMER = "Claimer";

export function SpawnClaimer(spawn: StructureSpawn, province: Province) : string | null
{
  const baseBody = [CLAIM,CLAIM, MOVE];
  const bodyAddon = [CLAIM];

  let largestBody = GetLargestBody(spawn, baseBody, bodyAddon, 6,true);
  if (largestBody.length == 0) {
    return null;
  }
  return SpawnCreep(spawn, largestBody, GetCreepMemory(CLAIMER,province.name));
}
