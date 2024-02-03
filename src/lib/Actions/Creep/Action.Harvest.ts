import { Action } from "../../Action";
import { all } from "lodash";
import { moveTo } from "screeps-cartographer";

export const HARVEST_ID: string = "H";

export class HarvestAction extends Action {

  Chat: string = "⛏️";
  Name: string = "Harvest";

  TargetId: Id<Source> | Id<Mineral>;

  get Target(): Source | Mineral | null {
    return Game.getObjectById(this.TargetId);
  }

  constructor(sourceId: Id<Source> | Id<Mineral>) {
    super();
    this.TargetId = sourceId;
  }


  toJSON(): string {
    return HARVEST_ID + ":" + this.TargetId;
  }

  static fromJSON(data: string) {
    let components = data.split(",", 1);
    let id = components[0] as Id<Source> | Id<Mineral>;
    return new HarvestAction(id);
  }

  isValid(creep: Creep): boolean {
    return this.Target !== null && creep.pos.isNearTo(this.Target) && (this.Target instanceof  Source ? this.Target.energy > 0 : this.Target.mineralAmount > 0);
  }

  run(creep: Creep): boolean {
    let target = this.Target;
    if(!target)
    {
      return false;
    }
    //Stay the fuck there and don't move
    moveTo(creep,creep.pos,{priority:1000});
    return creep.harvest(target) === OK;
  }

  ApproxTimeLeft(creep: Creep): number {
    return 1;
  }
}
