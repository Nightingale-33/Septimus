import { all, min, remove } from "lodash";
//import { AddRepairReservation } from "../../utils/Reservations/RepairReservations";
import { ReservingAction } from "../../Reservations/ReservationAction";
import { RepairReservation } from "../../Reservations/RepairReservations";

export const REPAIR_ID: string = "R";

export class RepairAction extends ReservingAction<RepairReservation> {

  Chat: string = "🔧";
  Name: string = "Repair";

  TargetId: Id<Structure>;
  ReservationId? : string;

  get Target(): Structure | null {
    return Game.getObjectById(this.TargetId);
  }

  constructor(structure: Structure, creep : Creep | undefined = undefined) {
    super();
    this.TargetId = structure.id;
    if(creep)
    {
      //this.ReservationId = AddRepairReservation(creep,structure,Math.min(creep.store.getUsedCapacity(RESOURCE_ENERGY) * REPAIR_POWER, structure.hitsMax - structure.hits));
    }
  }

  toJSON(): string {
    return REPAIR_ID + ":" + this.TargetId + "," + this.ReservationId;
  }

  static fromJSON(data: string) {
    let components = data.split(",",2);
    let id = components[0] as Id<Structure>;
    let reservationId = components[1];
    let target = Game.getObjectById(id);
    if (target) {
      let repairAction =  new RepairAction(target);
      if(reservationId && reservationId.length > 0)
      {
        repairAction.ReservationId = reservationId;
      }
      return repairAction;
    } else {
      return null;
    }
  }

  isComplete(creep: RoomObject): boolean {
    if (creep instanceof Creep) {
      let target = this.Target;
      if (!target) {
        return true;
      }
      return creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || target.hits == target.hitsMax || target.hitsMax <= 0;
    }
    throw new Error("Repair Actions not applicable to Non-Creeps");
  };

  cleanup(creep : Creep) : void {
    //remove(creep.memory.activeReservations, (s) => s === this.ReservationId);
  };

  run(creep: RoomObject): ScreepsReturnCode {
    if (creep instanceof Creep) {
      let target = this.Target;
      let result = target ? creep.repair(target) : ERR_INVALID_TARGET;
      if(target && result == OK)
      {
        // let thisReservation = target.room.memory.repairReservations[target.id]?.find((r) => r.reservationId == this.ReservationId);
        // if(thisReservation)
        // {
        //   let creepWorkParts = creep.body.map(bdp => bdp.type).filter(t => t == WORK).length;
        //   thisReservation.amount = Math.min(0,thisReservation.amount - creepWorkParts * REPAIR_POWER);
        // }
      }
      return result;
    }
    throw new Error("Repair Actions not applicable to Non-Creeps");
  }
}
