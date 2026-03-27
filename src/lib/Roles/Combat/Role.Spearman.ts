import { Province } from "../../../Province Level/Province";
import { GetCreepMemory, GetLargestBody, SpawnCreep } from "../../../utils/SpawnUtils";

export const SPEARMAN = "Spearman"

export const combatBodySortOrder : BodyPartConstant[] = [TOUGH,CARRY,MOVE,WORK,ATTACK,RANGED_ATTACK,CLAIM,HEAL];

function SortCombatParts(bp : BodyPartConstant) : number {
  return combatBodySortOrder.indexOf(bp);
}

export function SpawnSpearman(spawn: StructureSpawn, province: Province) : string | null
{
  const baseBody = [ATTACK, MOVE];
  const bodyAddon = [ATTACK];

  let largestBody = GetLargestBody(spawn, baseBody, bodyAddon,Infinity,true,true,SortCombatParts);
  if (largestBody.length == 0) {
    return null;
  }
  return SpawnCreep(spawn, largestBody, GetCreepMemory(SPEARMAN,province.name));
}
