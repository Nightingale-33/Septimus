import { Province } from "../../../Province Level/Province";
import { GetCreepMemory, GetLargestBody, SpawnCreep } from "../../../utils/SpawnUtils";

export const LEGIONNAIRE = "Legionnaire"

export const combatBodySortOrder : BodyPartConstant[] = [TOUGH,CARRY,MOVE,WORK,ATTACK,RANGED_ATTACK,CLAIM,HEAL];

function SortCombatParts(bp : BodyPartConstant) : number {
  return combatBodySortOrder.indexOf(bp);
}

export function SpawnLegionnaire(spawn: StructureSpawn, province: Province) : string | null
{
  const baseBody = [TOUGH, ATTACK, MOVE];
  const bodyAddon = [TOUGH,ATTACK];

  let largestBody = GetLargestBody(spawn, baseBody, bodyAddon,4,true,true,SortCombatParts);
  if (largestBody.length == 0) {
    return null;
  }
  return SpawnCreep(spawn, largestBody, GetCreepMemory(LEGIONNAIRE,province.name));
}
