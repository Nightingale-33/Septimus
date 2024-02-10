export const x = "";

declare global {
  interface RoomPosition {
    toJSON() : string;
    getMultiRoomRangeTo(target: RoomPosition | {pos: RoomPosition}) : number
  }
}

RoomPosition.prototype.toJSON = function(): string
{
  return `Pos(${this.x};${this.y};${this.roomName})`;
}

RoomPosition.prototype.getMultiRoomRangeTo = function(target: RoomPosition) : number
{
  if (this.roomName == target.roomName) {
    return this.getRangeTo(target);
  } else {
    const roomLinear = Game.map.getRoomLinearDistance(this.roomName,target.roomName);
    const dx = Math.abs(50 * roomLinear + target.x - this.x);
    const dy = Math.abs(50 * roomLinear + target.y - this.y);
    return Math.max(dx,dy);
  }
}
export function GetRoomPositionFromJSON(value: string) : RoomPosition
{
  if(!value)
  {
    throw new Error("Non existent Value passed");
  }
  if(!value.startsWith("Pos("))
  {
    throw new Error(`Room Position from JSON was called on: ${value}`);
  }

  value = value.slice(4,-1);
  let components = value.split(';',3);
  let x = parseInt(components[0]);
  let y = parseInt(components[1]);
  return new RoomPosition(x,y,components[2]);
}
