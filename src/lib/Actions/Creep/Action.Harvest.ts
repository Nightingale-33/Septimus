import { Action } from "../../Action";
import { all } from "lodash";

export const HARVEST_ID: string = "H";

export class HarvestAction extends Action {

  Chat: string = "⛏️";
  Name: string = "Harvest";

  TargetId: Id<Source | Mineral>;

  get Target(): Source | Mineral | null {
    return Game.getObjectById(this.TargetId);
  }

  constructor(source: Source | Mineral, suppressComplete: boolean = false) {
    super();
    this.TargetId = source.id;
    this.SuppressComplete = suppressComplete;
  }


  toJSON(): string {
    return HARVEST_ID + ":" + this.TargetId + "," + this.SuppressComplete;
  }

  static fromJSON(data: string) {
    let components = data.split(",", 2);
    let id = components[0] as Id<Source | Mineral>;
    let suppressComplete = components[1] == "true";
    let target = Game.getObjectById(id);
    if (target) {
      return new HarvestAction(target, suppressComplete);
    } else {
      return null;
    }
  }

  SuppressComplete: boolean = false;

  isComplete(creep: Creep): boolean {
    let source = Game.getObjectById(this.TargetId);
    let depleted = false;
    if (source instanceof Source) {
      depleted = source.energy <= 0;
    } else if (source instanceof Mineral) {
      depleted = source.mineralAmount <= 0;
    }
    return depleted || (!this.SuppressComplete && creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0);
  };

  run(creep: Creep): ScreepsReturnCode {
    let target = this.Target;
    return target ? creep.harvest(target) : ERR_INVALID_TARGET;
  }
}
