import { Action } from "../../Action";
import { AbstractCreep } from "../../Planning/AbstractCreep";

export const IDLE_ID: string = "I";

export class IdleAction extends Action {
  ApproxTimeLeft(creep: AbstractCreep): number {
      return 100000;
  }
  constructor(say: string | undefined = undefined) {
    super();
    if (say) {
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

  isValid(creep: Creep): boolean {
    return true;
  }

  run(creep: Creep): boolean {
    return true;
  }

  apply(ac: AbstractCreep) {
  }
}
