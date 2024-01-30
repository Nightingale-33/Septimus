import { Province } from "../../Province Level/Province";
import { SOURCE_HARVEST_PARTS } from "../../Constants";
import { GetCreepMemory, GetLargestBody, SpawnCreep } from "../../utils/SpawnUtils";

export const HARVESTER = "Harvester";

export function SpawnHarvester(spawn: StructureSpawn,priority: number, province: Province) : boolean
{
  const haulerBody = [WORK, CARRY, MOVE];
  const haulerBodyAddon = [WORK];

  let largestSlowBody = GetLargestBody(spawn,haulerBody,haulerBodyAddon,SOURCE_HARVEST_PARTS+1,false);
  let largestBody = GetLargestBody(spawn, haulerBody, haulerBodyAddon, SOURCE_HARVEST_PARTS+1,true);
  if(largestSlowBody.filter((bdc) => bdc == WORK).length > largestBody.filter((bdc) => bdc == WORK).length)
  {
    largestBody = largestSlowBody;
  }
  if (largestBody.length == 0) {
    return false;
  }
  return SpawnCreep(spawn, largestBody, GetCreepMemory(HARVESTER,province.name));
}
