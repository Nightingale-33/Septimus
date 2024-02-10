import { countBy, sortBy } from "lodash";
import { log } from "./Logging/Logger";
import { Role } from "../lib/Roles/Role";
import { Plan } from "../lib/Creep/Plan";

declare global {
  interface Memory {
    creepNum: number;
  }
}

export function MaxSpawnEnergy(spawn : StructureSpawn): number
{
  return spawn.room.energyCapacityAvailable;
}

export function AvailableSpawnEnergy(spawn : StructureSpawn): number
{
  return spawn.room.energyAvailable;
}

export const defaultBodySortOrder : BodyPartConstant[] = [TOUGH,CARRY,WORK,ATTACK,RANGED_ATTACK,CLAIM,HEAL,MOVE];

function defaultBodySort(a : BodyPartConstant) : number
{
  return defaultBodySortOrder.indexOf(a);
}

export function SortBodyParts(body: BodyPartConstant[], comparisonFunction: (a : BodyPartConstant) => number = defaultBodySort): BodyPartConstant[]
{
  return sortBy(body,comparisonFunction);
}

function FixBodyWithMove(body : BodyPartConstant[]) : BodyPartConstant[]
{
  let perType = countBy(body);
  let neededAdditionalMoveParts = Math.floor(Math.max(0,
    (perType[CARRY] ?? 0) * 2 +
    (perType[WORK] ?? 0) +
    (perType[TOUGH] ?? 0) +
    (perType[CLAIM] ?? 0) +
    (perType[ATTACK] ?? 0) +
    (perType[RANGED_ATTACK] ?? 0) +
    (perType[HEAL] ?? 0)
    - (perType[MOVE] ?? 0) * 2)
    / 2);
  if(neededAdditionalMoveParts == 0)
  {
    return body;
  }
  let additionalMove = [...Array(neededAdditionalMoveParts)].map(() => MOVE);
  return body.concat(additionalMove);
}

export function GetLargestBody(spawn : StructureSpawn, baseBody: BodyPartConstant[], bodyAddition: BodyPartConstant[], maximumAddons : number = Infinity, fixMove : boolean = true, sorted: boolean = true, sortBy : (a:BodyPartConstant) => number = defaultBodySort)
{
    let bodyToSpawn = baseBody;
    let lastWorkingBody : BodyPartConstant[] = [];
    let addons = 0;
    while (spawn.spawnCreep(bodyToSpawn, "Test", { dryRun: true }) == OK && addons < maximumAddons) {
      lastWorkingBody = bodyToSpawn;
      bodyToSpawn = bodyToSpawn.concat(bodyAddition);
      if(fixMove)
      {
        bodyToSpawn = FixBodyWithMove(bodyToSpawn);
      }
      addons++;
    }
    bodyToSpawn = lastWorkingBody;
    if(sorted)
    {
      bodyToSpawn = SortBodyParts(bodyToSpawn,sortBy);
    }
    return bodyToSpawn;
}

export function GetCreepMemory(role: Role, provinceName: string): CreepMemory
{
  return {role: role, Province: provinceName, activeReservations: [], plan: new Plan([]), assignmentId: undefined, assignmentPriority: undefined}
}

export function SpawnCreep(spawn : StructureSpawn, bodyToSpawn: BodyPartConstant[], memory: CreepMemory): string | null
{
  if (!spawn.isActive()) {
    log(1, "Attempted to spawn via inactive spawn");
    return null;
  }

  if (spawn.spawning) {
    log(5, "Spawner is currently busy");
    return null;
  }

  let creepName = memory.role + Memory.creepNum;
  let result = spawn.spawnCreep(bodyToSpawn, creepName, {
    memory: memory
  });
  if(result == OK)
  {
    Memory.creepNum++;
    log(1,`Spawn Spawning: ${creepName}`);
    return creepName;
  }
  return null;
}
