import { Province } from "../../Province Level/Province";
import { SOURCE_HARVEST_PARTS } from "../../constants";
import { GetCreepMemory, GetLargestBody, SpawnCreep } from "../../utils/SpawnUtils";

export const HARVESTER = "Harvester";

export function SpawnHarvester(spawn: StructureSpawn, province: Province) : string | null
{
  const haulerBody = [WORK,WORK, CARRY, MOVE];
  const haulerBodyAddon = [WORK];

  let largestSlowBody = GetLargestBody(spawn,haulerBody,haulerBodyAddon,SOURCE_HARVEST_PARTS,false);
  let largestBody = GetLargestBody(spawn, haulerBody, haulerBodyAddon, SOURCE_HARVEST_PARTS,true);
  if(largestSlowBody.filter((bdc) => bdc == WORK).length > largestBody.filter((bdc) => bdc == WORK).length)
  {
    largestBody = largestSlowBody;
  }
  if (largestBody.length == 0) {
    return null;
  }
  return SpawnCreep(spawn, largestBody, GetCreepMemory(HARVESTER,province.name));
}
