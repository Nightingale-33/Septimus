import { all } from "lodash";
import { Action } from "../../Action";
import { moveTo } from "screeps-cartographer";
import { AbstractCreep } from "../../Planning/AbstractCreep";
import { MovementRoomCallback } from "../../../utils/MovementUtils";

export const RECYCLE_ID: string = "Recycle";

export class RecycleAction extends Action {
  TargetId: Id<StructureSpawn>;

  get Target(): StructureSpawn | null {
    return Game.getObjectById(this.TargetId);
  }

  pos: RoomPosition;

  constructor(targetSpawn: StructureSpawn) {
    super();
    this.TargetId = targetSpawn.id;
    this.pos = targetSpawn.pos;
  }

  toJSON() {
    return RECYCLE_ID + ":" + this.TargetId;
  }

  static fromJSON(data: string) {
    let components = data.split(",", 1);
    let id = components[0] as Id<StructureSpawn>;
    let target = Game.getObjectById(id);
    if (target) {
      return new RecycleAction(target);
    } else {
      return null;
    }
  }

  Chat: string = "🗑️";
  Name: string = "Recycle";

  isValid(creep: Creep): boolean {
    return this.Target !== null;
  }

  run(creep: Creep): boolean {
    if (this.Target) {
      if (this.pos) {
        let avoidCreeps = creep.pos.getRangeTo(this.pos) < 5;
        moveTo(creep, { pos: this.pos, range: 1 }, { priority: 2, avoidCreeps: avoidCreeps, roomCallback:MovementRoomCallback, swampCost:5, plainCost:2 });
      }
      return this.Target.recycleCreep(creep) == OK;
    } else {
      let newTarget = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
      if (newTarget) {
        this.TargetId = newTarget.id;
        this.pos = newTarget.pos;
      }
    }
    return false;
  }

  ApproxTimeLeft(creep: AbstractCreep): number {
    let expected = 1;
    let travel = Math.max(this.pos?.getRangeTo(creep.pos) ?? 0,1) - 1;
    return travel + expected;
  }

  apply(ac: AbstractCreep) {
    ac.pos = this.pos;
    ac.body = [];
  }
}
