import { Province } from "../../Province Level/Province";
import { GetCreepMemory, GetLargestBody, SpawnCreep } from "../../utils/SpawnUtils";

export const WORKER = "Worker";

export function SpawnWorker(spawn: StructureSpawn, province: Province) : string | null
{
  const baseBody = [WORK, CARRY, MOVE];
  const bodyAddon = [WORK,CARRY];

  let largestBody = GetLargestBody(spawn, baseBody, bodyAddon);
  if (largestBody.length == 0) {
    return null;
  }
  return SpawnCreep(spawn, largestBody, GetCreepMemory(WORKER,province.name));
}
