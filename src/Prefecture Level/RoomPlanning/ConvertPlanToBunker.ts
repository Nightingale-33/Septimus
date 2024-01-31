/**
 * Convert a plan from https://screeps.admon.dev/building-planner
 * to a 2d matrix
 */

export interface BasePlan {
  buildings: {[id:string] : {x:number,y:number}[]}
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
