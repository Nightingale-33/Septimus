import { Action } from "../../Action";
import { all } from "lodash";

export const UPGRADE_ID: string = "U";

export class UpgradeAction extends Action {

  Chat: string = "🔌";
  Name: string = "Upgrade";

  TargetId: Id<StructureController>;

  get Target(): StructureController | null {
    return Game.getObjectById(this.TargetId);
  }

  constructor(controller: StructureController) {
    super();
    this.TargetId = controller.id;
  }

  toJSON(): string {
    return UPGRADE_ID + ":" + this.TargetId;
  }

  static fromJSON(data: string) {
    let id = data as Id<StructureController>;
    let target = Game.getObjectById(id);
    if (target) {
      return new UpgradeAction(target);
    } else {
      return null;
    }
  }

  isComplete(creep: RoomObject): boolean {
    if (creep instanceof Creep) {
      return creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0;
    }
    throw new Error("Upgrade Actions not applicable to Non-Creeps");
  };

  cleanup(creep : Creep) : void {};

  run(runner: RoomObject): ScreepsReturnCode {
    if (runner instanceof Creep) {
      let target = this.Target;
      return target ? runner.upgradeController(target) : ERR_INVALID_TARGET;
    }
    throw new Error("Upgrade Actions not applicable to Non-Creeps");
  }
}
