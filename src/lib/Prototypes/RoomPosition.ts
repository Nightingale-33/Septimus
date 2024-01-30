import { JSON_FLAG } from "../../utils/Logging/FlagDecs";
import { log } from "../../utils/Logging/Logger";

export const x = "";

declare global {
  interface RoomPosition {
    toJSON() : string;
  }
}

RoomPosition.prototype.toJSON = function(): string
{
  return `Pos(${this.x};${this.y};${this.roomName})`;
}

export function GetRoomPositionFromJSON(value: string) : RoomPosition
{
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
