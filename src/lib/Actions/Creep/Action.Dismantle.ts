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

  isValid(creep: Creep): boolean {
    return this.Target !== null;
  }

  cleanup(creep : Creep) : void {};

  run(creep: Creep): boolean {
    let target = this.Target;
    return (target ? creep.dismantle(target) : ERR_INVALID_TARGET) == OK;
  }
}
