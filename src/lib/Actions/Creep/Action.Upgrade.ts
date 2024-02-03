import { Action } from "../../Action";
import { countBy } from "lodash";

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

  isValid(creep: Creep): boolean {
    return this.Target !== null && creep.pos.inRangeTo(this.Target,3) && creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
  }

  cleanup(creep : Creep) : void {};

  run(creep: Creep): boolean {
    let target = this.Target;
    return (target ? creep.upgradeController(target) : ERR_INVALID_TARGET) == OK;
  }

  ApproxTimeLeft(creep: Creep): number {
    if(!this.Target)
    {
      return 0;
    }
    let creepWorkParts = countBy(creep.body, (bpd) => bpd.type)[WORK];
    let remainingEnergy = creep.store.getUsedCapacity(RESOURCE_ENERGY);
    return Math.ceil(remainingEnergy / (creepWorkParts));
  }
}
