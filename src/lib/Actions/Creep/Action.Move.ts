import { Action } from "../../Action";
import { all, any, isNumber, parseInt } from "lodash";
import { GetPositionFromDirection } from "../../../utils/MovementUtils";
import { log } from "../../../utils/Logging/Logger";

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
    return MOVE_ID + ":" + this.Target.x + "," + this.Target.y + "," + this.Target.roomName + "," + this.Range;
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
    return creep.body.filter((b) => b.type === MOVE && b.hits > 0).length > 0;
  }

  isComplete(creep: Creep): boolean {
    return creep.pos.inRangeTo(this.Target, this.Range);
  };

  run(creep: Creep): boolean {
     //let attemptedRoute = creep.memory._move?.path?.charAt(0);
    let result = creep.moveTo(this.Target,
      {
        range: this.Range,
        reusePath: Math.max(creep.pos.getRangeTo(this.Target) * 0.75, 5),
        ignoreCreeps: (creep.pos.findClosestByRange(FIND_CREEPS)?.pos.getRangeTo(creep.pos) ?? Infinity) > 2,
        visualizePathStyle: {}
      });
    if (result != OK && result != ERR_TIRED && result != ERR_BUSY && this.Shove) {
      log(1, `Shoving Creep: ${creep.name} has error: ${result} on movement`);
    }
    if (result == ERR_NO_PATH && this.Shove) {
      // //Consider shoving logic
      // if (attemptedRoute) {
      //   let nextDirNum = parseInt(attemptedRoute);
      //   let nextPos = GetPositionFromDirection(creep.pos, nextDirNum);
      //   let occupyingCreeps = nextPos.lookFor(LOOK_CREEPS);
      //   for (const inTheWay of occupyingCreeps) {
      //     log(1, `Shoving: ${inTheWay.name} out of the way of ${creep.name}`);
      //     inTheWay.memory.plan.Steps.unshift(new MoveAction(creep.pos));
      //   }
      // } else {
      //   log(1, `${creep.name} was unable to figure out how to shove`);
      // }
    }
    return result == OK || result == ERR_TIRED;
  }
}
