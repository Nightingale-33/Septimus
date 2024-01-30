import { all } from "lodash";
import { Action } from "../../Action";

export const RECYCLE_ID: string = "Recycle";

export class RecycleAction extends Action {
  TargetId : Id<StructureSpawn>;
  get Target(): StructureSpawn | null {
    return Game.getObjectById(this.TargetId);
  }

  constructor(targetSpawn : StructureSpawn) {
    super();
    this.TargetId = targetSpawn.id;
  }

  toJSON() {
    return RECYCLE_ID + ":" + this.TargetId;
  }

  static fromJSON(data: string) {
    let components = data.split(",",1);
    let id = components[0] as Id<StructureSpawn>;
    let target = Game.getObjectById(id);
    if(target) {
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

  isComplete(_: RoomObject): boolean {
    return false;
  };

  cleanup(creep : Creep) : void {};

  run(creep: Creep): boolean {
    if (this.Target) {
      return this.Target.recycleCreep(creep) == OK;
    } else {
      let newTarget = creep.pos.findClosestByRange(FIND_MY_SPAWNS)
      if (newTarget) {
        this.TargetId = newTarget.id;
      }
    }
    return false;
  }
}
