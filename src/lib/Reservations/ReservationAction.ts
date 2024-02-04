import { Action } from "../Action";
import { Reservation, reservationId } from "./Reservation";
import { remove } from "lodash";
import { BuildReservation } from "./BuildReservations";
import { RepairReservation } from "./RepairReservations";
import { ResourceReservation } from "./ResourceReservations";

declare global {
  interface CreepMemory {
    activeReservations: reservationId[];
  }
}

export abstract class ReservingAction<T extends Reservation<{ id: Id<Creep> }, _HasId>> extends Action {

  ReservationId?: reservationId;
  Reservation? : Reservation<{ id: Id<Creep> }, _HasId>;

  protected constructor(reservation: T | undefined = undefined) {
    super();
    if (reservation) {
      this.Reservation = reservation;
      this.ReservationId = reservation.reservationId;
      if (reservation instanceof BuildReservation) {
        BuildReservation.AddReservation(reservation);
      } else if (reservation instanceof RepairReservation) {
        RepairReservation.AddReservation(reservation);
      } else if (reservation instanceof ResourceReservation) {
        ResourceReservation.AddReservation(reservation);
      } else {
        throw new Error("Unrecognised Reservation type for registering");
      }
    }

  }

  cleanup(creep: Creep) {
    super.cleanup(creep);
    remove(creep.memory.activeReservations, (s) => s === this.ReservationId);
  }

}
