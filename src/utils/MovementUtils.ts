
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

  return new RoomPosition(pos.x + xDiff, pos.y + yDiff, pos.roomName);
}

const isObstacle = _.transform(
  OBSTACLE_OBJECT_TYPES,
  (o, type) => { o[type] = true; },
  {}
);

export function isEnterable(pos : RoomPosition) {
  return _.every(pos.look(), item =>
    item.type === 'terrain' ?
      item.terrain !== 'wall' :
      !isObstacle[item.structure?.structureType ?? ""]
  );
}
