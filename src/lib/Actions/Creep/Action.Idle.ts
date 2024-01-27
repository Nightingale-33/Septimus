import { all } from "lodash";
import { Action } from "../../Action";

export const IDLE_ID: string = "I";

export class IdleAction extends Action {
  constructor(say : string | undefined = undefined) {
    super();
    if(say)
    {
      this.Chat = say;
    }
  }

  toJSON() {
    return IDLE_ID + ":";
  }

  static fromJSON(data: string) {
    return new IdleAction();
  }

  Chat: string = "💤";
  Name: string = "Idle";

  isComplete(_: RoomObject): boolean {
    return true;
  };

  cleanup(creep : Creep) : void {};

  run(runner: RoomObject): ScreepsReturnCode {
    if (runner instanceof Creep) {
      let Direction = Math.floor(Math.random() * 57);
      let Dir = ((Direction % 8) + 1) as DirectionConstant;
      return runner.move(Dir);
    } else {
      return OK;
    }
  }
}
