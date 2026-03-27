import { Province } from "../../Province Level/Province";
import { SOURCE_HARVEST_PARTS } from "../../Constants";
import { GetCreepMemory, GetLargestBody, SpawnCreep } from "../../utils/SpawnUtils";

export const EXTRACTOR = "Extractor";

export function SpawnExtractor(spawn: StructureSpawn, province: Province) : string | null
{
  const baseBod = [WORK, MOVE];
  const bodyAddon = [WORK];

  let largestSlowBody = GetLargestBody(spawn,baseBod,bodyAddon,SOURCE_HARVEST_PARTS,false);
  let largestBody = GetLargestBody(spawn, baseBod, bodyAddon, SOURCE_HARVEST_PARTS,true);
  if(largestSlowBody.filter((bdc) => bdc == WORK).length > largestBody.filter((bdc) => bdc == WORK).length)
  {
    largestBody = largestSlowBody;
  }
  if (largestBody.length == 0) {
    return null;
  }
  return SpawnCreep(spawn, largestBody, GetCreepMemory(EXTRACTOR,province.name));
}
