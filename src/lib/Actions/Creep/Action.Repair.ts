import { ReservingAction } from "../../Reservations/ReservationAction";
import { RepairReservation } from "../../Reservations/RepairReservations";

export const REPAIR_ID: string = "R";

export class RepairAction extends ReservingAction<RepairReservation> {

  Chat: string = "🔧";
  Name: string = "Repair";

  TargetId: Id<Structure>;

  get Target(): Structure | null {
    return Game.getObjectById(this.TargetId);
  }

  constructor(structure: Structure, creep : Creep | undefined = undefined) {
    let reservation : RepairReservation | undefined = undefined;
    if(creep)
    {
      let reservationAmount = Math.min(0,Math.min(creep.store.getUsedCapacity(RESOURCE_ENERGY) * REPAIR_POWER, structure.hitsMax - structure.hits));
      reservation = new RepairReservation(creep,structure,reservationAmount);
    }
    super(reservation);
    this.TargetId = structure.id;
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

  isValid(creep: Creep): boolean {
    return this.Target !== null && creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0 && this.Target.hits < this.Target.hitsMax;
  }

  cleanup(creep : Creep) : void {
    //remove(creep.memory.activeReservations, (s) => s === this.ReservationId);
  };

  run(creep: Creep): boolean {
    let target = this.Target;
    let result = target ? creep.repair(target) : ERR_INVALID_TARGET;
    if (target && result == OK) {
      let thisReservation = Memory.RepairResv[target.id]?.find((r) => r.reservationId == this.ReservationId);
      if(thisReservation)
      {
        let creepWorkParts = creep.body.map(bdp => bdp.type).filter(t => t == WORK).length;
        thisReservation.amount = Math.min(0,thisReservation.amount - creepWorkParts * REPAIR_POWER);
      }
    }
    return result == OK;
  }
}
