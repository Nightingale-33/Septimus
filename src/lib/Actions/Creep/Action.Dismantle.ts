import { Action } from "../../Action"

export const DISMANTLE_ID : string = "D";

export class DismantleAction extends Action {

  Chat: string = "🧨";
  Name: string = "Dismantle";


  TargetId: Id<Structure>;

  get Target(): Structure | null {
    return Game.getObjectById(this.TargetId);
  }

  constructor(structure: Structure) {
    super();
    this.TargetId = structure.id;
  }

  toJSON(): string {
    return DISMANTLE_ID + ":" + this.TargetId;
  }

  static fromJSON(data : string) {
    let id = data as Id<Structure>;
    let target = Game.getObjectById(id);
    if(target)
    {
      return new DismantleAction(target);
    } else
    {
      return null;
    }
  }

  isComplete(creep:RoomObject) : boolean
  {
    if(creep instanceof Creep)
    {
      return creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0 || (!Game.getObjectById(this.TargetId));
    }
    throw new Error("Dismantle Actions not applicable to Non-Creeps");
  };

  cleanup(creep : Creep) : void {};

  run(creep: RoomObject): ScreepsReturnCode {
    if(creep instanceof Creep)
    {
      let target  = this.Target;
      return target ? creep.dismantle(target) : ERR_INVALID_TARGET;
    }
    throw new Error("Dismantle Actions not applicable to Non-Creeps");
  }
}
