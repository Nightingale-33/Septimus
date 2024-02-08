import { Action } from "../../Action";
import { moveTo } from "screeps-cartographer";
import { AbstractCreep } from "../../Planning/AbstractCreep";
import { MovementRoomCallback } from "../../../utils/MovementUtils";

export const DISMANTLE_ID: string = "D";

export class DismantleAction extends Action {

  Chat: string = "🧨";
  Name: string = "Dismantle";


  TargetId: Id<Structure>;

  get Target(): Structure | null {
    return Game.getObjectById(this.TargetId);
  }

  pos: RoomPosition;

  constructor(structure: Structure) {
    super();
    this.TargetId = structure.id;
    this.pos = structure.pos;
  }

  toJSON(): string {
    return DISMANTLE_ID + ":" + this.TargetId;
  }

  static fromJSON(data: string) {
    let id = data as Id<Structure>;
    let target = Game.getObjectById(id);
    if (target) {
      return new DismantleAction(target);
    } else {
      return null;
    }
  }

  isValid(creep: Creep): boolean {
    return this.Target !== null;
  }

  run(creep: Creep): boolean {
    let target = this.Target;
    if (this.pos) {
      let avoidCreeps = creep.pos.getRangeTo(this.pos) < 5;
      moveTo(creep, { pos: this.pos, range: 1 }, { priority: 50, avoidCreeps: avoidCreeps, roomCallback:MovementRoomCallback });
    }
    return (target ? creep.dismantle(target) : ERR_INVALID_TARGET) == OK;
  }

  ApproxTimeLeft(creep: AbstractCreep): number {
    throw new Error("Approx Time not calculated for Dismantle");
  }

  apply(ac: AbstractCreep) {
  }
}
