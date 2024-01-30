import { Action } from "../../Action";
import { all } from "lodash";

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
    return this.Target !== null;
  }

  isComplete(creep: Creep): boolean {
    let source = Game.getObjectById(this.TargetId);
    let depleted = false;
    if (source instanceof Source) {
      depleted = source.energy <= 0;
    } else if (source instanceof Mineral) {
      depleted = source.mineralAmount <= 0;
    }
    return depleted;
  };

  run(creep: Creep): boolean {
    let target = this.Target;
    return (target ? creep.harvest(target) : ERR_INVALID_TARGET) === OK;
  }
}
