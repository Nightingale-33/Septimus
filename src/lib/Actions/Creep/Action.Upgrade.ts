import { Action } from "../../Action";
import { countBy } from "lodash";
import { moveTo } from "screeps-cartographer";
import { AbstractCreep } from "../../Planning/AbstractCreep";
import { CountParts } from "../../../utils/CreepUtils";
import { MovementRoomCallback } from "../../../utils/MovementUtils";

export const UPGRADE_ID: string = "U";

export class UpgradeAction extends Action {

  Chat: string = "🔌";
  Name: string = "Upgrade";

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
    return this.Target !== null && creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
  }

  run(creep: Creep): boolean {
    let target = this.Target;
    if(this.pos)
    {
      let range = creep.pos.getRangeTo(this.pos);
      moveTo(creep,{pos:this.pos,range:3},{priority:range,avoidCreeps:false, roomCallback:MovementRoomCallback, swampCost:5, plainCost:2});
    }
    return (target ? creep.upgradeController(target) : ERR_INVALID_TARGET) == OK;
  }

  ApproxTimeLeft(creep: AbstractCreep): number {
    if(!this.Target)
    {
      return 0;
    }
    let creepWorkParts = CountParts(creep)[WORK];
    let remainingEnergy = creep.store.getUsedCapacity(RESOURCE_ENERGY);
    let expected = Math.ceil(remainingEnergy / (creepWorkParts));
    let travel = Math.max(this.pos?.getRangeTo(creep.pos) ?? 0,3) - 3;
    return travel + expected;
  }

  apply(ac: AbstractCreep) {
    ac.pos = this.pos;
    ac.store.setUsed(RESOURCE_ENERGY,0);
  }
}
