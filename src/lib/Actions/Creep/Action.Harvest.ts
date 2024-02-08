import { Action } from "../../Action";
import { all } from "lodash";
import { moveTo } from "screeps-cartographer";
import { CountParts } from "../../../utils/CreepUtils";
import { AbstractCreep } from "../../Planning/AbstractCreep";
import { MovementRoomCallback } from "../../../utils/MovementUtils";

export const HARVEST_ID: string = "H";

export class HarvestAction extends Action {

  Chat: string = "⛏️";
  Name: string = "Harvest";

  TargetId: Id<Source> | Id<Mineral>;

  get Target(): Source | Mineral | null {
    return Game.getObjectById(this.TargetId);
  }

  pos: RoomPosition;

  constructor(sourceId: Id<Source> | Id<Mineral>, pos : RoomPosition) {
    super();
    this.TargetId = sourceId;
    this.pos = pos;
  }


  toJSON(): string {
    return HARVEST_ID + ":" + this.TargetId;
  }

  static fromJSON(data: string) {
    let components = data.split(",", 1);
    let id = components[0] as Id<Source> | Id<Mineral>;
    let obj = Game.getObjectById(id);
    if(!obj)
    {
      return null;
    }
    return new HarvestAction(obj.id,obj.pos);
  }

  isValid(creep: Creep): boolean {
    return this.Target !== null && (this.Target instanceof Source ? this.Target.energy > 0 : this.Target.mineralAmount > 0);
  }

  run(creep: Creep): boolean {
    let target = this.Target;
    if (this.pos) {
      let prio = creep.pos.getRangeTo(this.pos) === 1 ? 500 : 250;
      moveTo(creep, { pos: this.pos, range: 1 }, { priority: prio, avoidCreeps: false, roomCallback:MovementRoomCallback }, {avoidCreeps:true});
    }
    if (!target) {
      return false;
    }
    return creep.harvest(target) === OK;
  }

  ApproxTimeLeft(creep: AbstractCreep): number {
    let expected = 0;
    if(this.Target instanceof Source)
    {
      expected = this.Target.energy / CountParts(creep)[WORK] * HARVEST_POWER;
    } else if(this.Target instanceof Mineral)
    {
      expected = this.Target.mineralAmount / CountParts(creep)[WORK] * HARVEST_POWER;
    }
    let travel = Math.max(this.pos?.getRangeTo(creep.pos) ?? 0,1) - 1;
    return travel + expected;
  }

  apply(ac: AbstractCreep) {
    ac.pos = this.pos;
    ac.store.setUsed(RESOURCE_ENERGY,ac.store.getCapacity(RESOURCE_ENERGY));
  }
}
