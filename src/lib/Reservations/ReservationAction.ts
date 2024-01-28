import { Action } from "../Action";
import { Reservation, reservationId } from "./Reservation";
import { remove } from "lodash";

declare global {
  interface CreepMemory {
    activeReservations: reservationId[];
  }
}

export class ReservingAction<T extends Reservation<Creep,_HasId>> extends Action {

  ReservationId?:reservationId;

  constructor(reservation: T | undefined = undefined) {
    super();
    if (reservation)
    {
      this.ReservationId = reservation.reservationId;
    }

  }

  cleanup(creep: Creep) {
    super.cleanup(creep);
    remove(creep.memory.activeReservations, (s) => s === this.ReservationId);
  }

}
