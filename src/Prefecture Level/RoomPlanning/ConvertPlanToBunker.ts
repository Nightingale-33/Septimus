/**
 * Convert a plan from https://screeps.admon.dev/building-planner
 * to a 2d matrix
 */
import { designDiamond } from "./BaseDesignDiamond";
import { isEnterable } from "../../utils/MovementUtils";

export interface BasePlan {
  buildings: {[id:string] : {x:number,y:number}[]}
}

export const defaultBuildStructureOrder : BuildableStructureConstant[] = [STRUCTURE_SPAWN,STRUCTURE_STORAGE,STRUCTURE_EXTENSION,STRUCTURE_TOWER,STRUCTURE_LINK,STRUCTURE_ROAD,STRUCTURE_RAMPART];
export function GetBuildsFromPlan(bp : BasePlan, anchor: RoomPosition, buildSortOrder? : (buildA: [BuildableStructureConstant, RoomPosition], buildB: [BuildableStructureConstant, RoomPosition]) => number) : [BuildableStructureConstant, RoomPosition][]
{
  function defaultBuildSortOrder(buildA: [BuildableStructureConstant, RoomPosition], buildB: [BuildableStructureConstant, RoomPosition]) : number
  {
    let indexOfA = defaultBuildStructureOrder.indexOf(buildA[0]);
    if(indexOfA < 0)
    {
      indexOfA = Infinity;
    }

    let indexOfB = defaultBuildStructureOrder.indexOf(buildB[0]);
    if(indexOfB < 0)
    {
      indexOfB = Infinity;
    }

    let relativeType = indexOfA - indexOfB;
    if(relativeType === 0)
    {
      return anchor.getRangeTo(buildA[1].x ,buildA[1].y) - anchor.getRangeTo(buildB[1].x,buildB[1].y);
    } else
    {
      return relativeType;
    }
  }

  let builds: [BuildableStructureConstant, RoomPosition][] = [];
  for(const structType in bp.buildings)
  {
    for(const {x,y} of bp.buildings[structType])
    {
      let pos = new RoomPosition(anchor.x + x,anchor.y + y,anchor.roomName);
      builds.push([structType as BuildableStructureConstant, pos]);
    }
  }
  return builds.sort(buildSortOrder ?? defaultBuildSortOrder);
}

//Script for converting
/*
const plan = {};
const xCoordinates = Object.values(plan.buildings)
  .flat()
  .map(({ x }) => x);
const minX = Math.min(...xCoordinates);
const maxX = Math.max(...xCoordinates);
const width = maxX - minX + 1;

const yCoordinates = Object.values(plan.buildings)
  .flat()
  .map(({ y }) => y);
const minY = Math.min(...yCoordinates);
const maxY = Math.max(...yCoordinates);
const height = maxY - minY + 1;

const center = {x: Math.floor(width/2) + minX, y: Math.floor(height/2) + minY};

console.log({ width, height, center });
for(const s in plan.buildings)
{
  for(const pos of plan.buildings[s])
  {
    pos.x -= center.x;
    pos.y -= center.y;
  }
}

console.log(JSON.stringify(plan).replace(/"/g,''));
*/
