import { Action } from "../../Action";
import { moveTo } from "screeps-cartographer";
import { AbstractCreep } from "../../Planning/AbstractCreep";
import { CountParts } from "../../../utils/CreepUtils";
import { MovementRoomCallback } from "../../../utils/MovementUtils";

export const RESERVE_ID: string = "Q";

export class ReserveAction extends Action {

  Chat: string = "🍽️";
  Name: string = "Reserve";

  TargetId: Id<StructureController>;

  get Target(): StructureController | null {
    return Game.getObjectById(this.TargetId);
  }

  pos: RoomPosition;

  constructor(controller: StructureController) {
    super();
    this.TargetId = controller.id;
    this.pos = controller.pos;
  }

  toJSON(): string {
    return RESERVE_ID + ":" + this.TargetId;
  }

  static fromJSON(data: string) {
    let id = data as Id<StructureController>;
    let target = Game.getObjectById(id);
    if (target) {
      return new ReserveAction(target);
    } else {
      return null;
    }
  }

  isValid(creep: Creep): boolean {
    return CountParts(creep)[CLAIM] > 0 && !(this.Target?.my);
  }

  run(creep: Creep): boolean {
    let target = this.Target;
    if(this.pos)
    {
      moveTo(creep,{pos:this.pos,range:1},{priority:1000,avoidCreeps:false, roomCallback:MovementRoomCallback, swampCost:5, plainCost:2});
    }
    return (target ? creep.reserveController(target) : ERR_INVALID_TARGET) == OK;
  }

  ApproxTimeLeft(creep: AbstractCreep): number {
    let travel = Math.max(this.pos?.getMultiRoomRangeTo(creep.pos) ?? 0,1) - 1;
    return travel + 600;
  }

  apply(ac: AbstractCreep) {
    ac.pos = this.pos;
  }
}
