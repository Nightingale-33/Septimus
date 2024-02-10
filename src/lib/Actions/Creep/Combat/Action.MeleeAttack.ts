import { Action } from "../../../Action";
import { moveTo } from "screeps-cartographer";
import { AbstractCreep } from "../../../Planning/AbstractCreep";
import { CountParts } from "../../../../utils/CreepUtils";

export const MELEE_ID: string = "K";

export class MeleeAction extends Action {
  Chat: string = "🗡️";
  Name: string = "Melee";

  TargetId: Id<Creep | Structure>;
  get Target() : Creep | Structure | null { return Game.getObjectById(this.TargetId);}

  constructor(target: Creep | Structure) {
    super();
    this.TargetId = target.id;
  }

  toJSON(): string {
    return MELEE_ID + ":" + this.TargetId;
  }

  static fromJSON(data: string) {
    let components = data.split(",", 1);
    let enemy = Game.getObjectById(components[0] as Id<Creep | Structure>);
    if(enemy)
    {
      return new MeleeAction(enemy);
    }
    return null;
  }

  isValid(creep: Creep): boolean {
    return this.Target !== null && CountParts(creep)[ATTACK] > 0;
  }

  run(creep: Creep): boolean {
    if(!this.Target)
    {
      return false;
    }
    let avoidCreeps = false;
    let result = moveTo(creep, {pos: this.Target.pos, range: 1}, {
      priority: 1000,
      visualizePathStyle: {},
      avoidCreeps: avoidCreeps,
    }, { visualizePathStyle: { stroke: "#FF0000" }, avoidCreeps: true });

    if(creep.pos.isNearTo(this.Target))
    {
      creep.attack(this.Target);
    }

    return result == OK || result == ERR_TIRED;
  }

  ApproxTimeLeft(creep: AbstractCreep): number {
    let expected = 1;
    let travel = Math.max(this.Target?.pos?.getMultiRoomRangeTo(creep.pos) ?? 0,1) - 1;
    return travel + expected;
  }

  apply(ac: AbstractCreep) {
    if(!this.Target)
    {
      return;
    }
    ac.pos = this.Target.pos;
  }
}
