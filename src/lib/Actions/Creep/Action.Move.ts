import { Action } from "../../Action";
import { all, any, isNumber, parseInt } from "lodash";
import { GetPositionFromDirection } from "../../../utils/MovementUtils";
import { log } from "../../../utils/Logging/Logger";
import { moveTo } from "screeps-cartographer"
import { AbstractCreep } from "../../Planning/AbstractCreep";

export const MOVE_ID: string = "M";

export class MoveAction extends Action {
  Chat: string = "🚂";
  Name: string = "Move";

  Target: RoomPosition;
  Range: number;
  Shove: boolean;

  constructor(target: RoomPosition | RoomObject, range: number = 0, shoveAllowed: boolean = false) {
    super();
    if (target instanceof RoomPosition) {
      this.Target = target;
    } else {
      this.Target = target.pos;
    }

    this.Range = range;
    this.Shove = shoveAllowed;
  }

  toJSON(): string {
    return MOVE_ID + ":" + this.Target.x + "," + this.Target.y + "," + this.Target.roomName + "," + this.Range + "," + this.Shove;
  }

  static fromJSON(data: string) {
    let components = data.split(",", 5);
    let x = parseInt(components[0]);
    let y = parseInt(components[1]);
    let pos = new RoomPosition(x, y, components[2]);
    let range = parseInt(components[3]);
    let shove = components[4] == "true";
    if (pos) {
      return new MoveAction(pos, range);
    } else {
      throw new Error(`Unable to parse: ${data} as Move Action`);
    }
  }

  isValid(creep: Creep): boolean {
    return creep.body.filter((b) => b.type === MOVE && b.hits > 0).length > 0 && creep.pos.getRangeTo(this.Target) > this.Range;
  }

  run(creep: Creep): boolean {
    let avoidCreeps = !this.Shove && creep.pos.getRangeTo(this.Target) < 5;
    let result = moveTo(creep,{ pos:this.Target, range: this.Range}, {priority: this.Shove ? Infinity : 1,visualizePathStyle:{}, avoidCreeps: avoidCreeps},{visualizePathStyle:{stroke:"#FF0000"}, avoidCreeps:true});
    return result == OK || result == ERR_TIRED;
  }

  ApproxTimeLeft(creep: AbstractCreep): number {
    return creep.pos.getRangeTo(this.Target);
  }

  apply(ac: AbstractCreep) {
    ac.pos = this.Target;
  }
}
