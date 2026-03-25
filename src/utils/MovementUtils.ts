import { every, flatten, isObject, map, transform } from "lodash";
import { Mission } from "../lib/Mission/Mission";
import { Delegation } from "../lib/Delegation";
import { TRACE_FLAG } from "./Logging/FlagDecs";
import { log } from "./Logging/Logger";

export interface MoveDefinition {
  dest: RoomPosition,
  time: number,
  path: string,
  room: string
}

export function GetPositionFromDirection(pos: RoomPosition, dir: number): RoomPosition
{
  let xDiff = 0;
  let yDiff = 0;
  switch(dir) {

    case TOP: yDiff = -1; break;
    case TOP_LEFT: xDiff = -1; yDiff = -1; break;
    case TOP_RIGHT: xDiff = 1; yDiff = -1; break;


    case BOTTOM: yDiff = 1; break;
    case BOTTOM_LEFT: xDiff = -1; yDiff = 1; break;
    case BOTTOM_RIGHT: xDiff = 1; yDiff = 1; break;

    case LEFT: xDiff = -1; break;
    case RIGHT: xDiff = 1; break;
  }

  log(TRACE_FLAG,`Direction Room Pos Args: (${pos.x + xDiff}, ${pos.y + yDiff}, ${pos.roomName})`);
  return new RoomPosition(pos.x + xDiff, pos.y + yDiff, pos.roomName);
}

const isObstacle = transform(
  OBSTACLE_OBJECT_TYPES,
  (o, type) => { o[type] = true; },
  {}
);

export function isEnterable(pos : RoomPosition) {
  return every(pos.look(), item =>
    item.type === 'terrain' ?
      item.terrain !== 'wall' :
      !isObstacle[item.structure?.structureType ?? ""]
  );
}

export interface CostMatrixAdjuster
{
  adjustCostMatrix(roomName : string, cm:CostMatrix) : CostMatrix;
}

export function IsCostMatrixAdjuster<T extends Object>(obj : T) : boolean
{
  return isObject(obj) && 'adjustCostMatrix' in obj;
}

export function MovementRoomCallback(roomName: string): boolean | CostMatrix {
  return global.cache.UseValue(() => {
    return FreshMovementRoomCallback(roomName);
  }, 10,`${roomName}_CostMatrix`);
}

export function FreshMovementRoomCallback(roomName: string): boolean | CostMatrix {
  let cm = new PathFinder.CostMatrix();
  if(global.empire)
  {
    let empireMissions = Object.values(global.empire.ActiveMissions);
    let empireDelegations = global.empire.Delegations;
    let relevantPrefecture = flatten(map(global.empire.Provinces ?? [],(p) => p.Prefectures)).find((p) => p.RoomName === roomName);
    if(relevantPrefecture)
    {
      let missions = empireMissions.concat(Object.values(relevantPrefecture.province.ActiveMissions)).filter((m) : m is (Mission & CostMatrixAdjuster) => m.pos.roomName === roomName && IsCostMatrixAdjuster(m));
      let delegations = empireDelegations.concat(relevantPrefecture.province.Delegations.concat(relevantPrefecture.Delegations)).filter((d) : d is (Delegation & CostMatrixAdjuster) => IsCostMatrixAdjuster(d));
      for(const mission of missions)
      {
        cm = mission.adjustCostMatrix(roomName,cm);
      }
      for(const delegation of delegations)
      {
        cm = delegation.adjustCostMatrix(roomName,cm);
      }
    }
  }
  return cm;
}
