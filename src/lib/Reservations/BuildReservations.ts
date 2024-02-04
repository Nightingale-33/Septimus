import { Reservation } from "./Reservation";
import { remove } from "lodash";
import { AbstractCreep } from "../Planning/AbstractCreep";

declare global {
  interface Memory {
    BuildResv: { [id: Id<ConstructionSite>]: BuildReservation[] };
  }
}

export class BuildReservation extends Reservation<Creep | AbstractCreep, ConstructionSite> {
  constructor(creep: Creep | AbstractCreep, cs: ConstructionSite, amount: number) {
    super(creep, cs, amount);
  }

  static CheckMemory(target: ConstructionSite): boolean {
    if (!Memory.BuildResv) {
      Memory.BuildResv = {};
    }

    if (!Memory.BuildResv[target.id]) {
      return false;
    }

    return true;
  }

  static AddReservation(reservation: BuildReservation) {
    if (!Memory.BuildResv[reservation.reserved]) {
      Memory.BuildResv[reservation.reserved] = [];
    }
    if (!Memory.BuildResv[reservation.reserved].find((r) => r.reservationId === reservation.reservationId)) {
      Memory.BuildResv[reservation.reserved].push(reservation);
      let reserver = Game.getObjectById(reservation.reserver);
      if (reserver instanceof Creep) {
        reserver.memory.activeReservations.push(reservation.reservationId);
      } else {
        throw new Error("Attempting to reserve with a non-existent reseserver");
      }
    }

  }

  static GetPostReservationProgress(target: ConstructionSite): number {
    let progress = target.progress;

    if (!this.CheckMemory(target)) {
      return progress;
    }

    for (const reservation of Memory.BuildResv[target.id]) {
      progress += reservation.amount;
    }

    return progress;
  }

  static Cleanup() {
    for (const idStr in Memory.BuildResv) {
      let id = idStr as Id<any>;
      if (!Game.getObjectById(id)) {
        delete Memory.BuildResv[id];
      }

      remove(Memory.BuildResv[id], (reservation) => {
        let reserver = Game.getObjectById(reservation.reserver);
        if (!(reserver instanceof Creep)) {
          return true;
        }
        //Check the reserver still has it
        return !(reserver.memory.activeReservations.find((s) => s === reservation.reservationId));

      });
    }
  }

}
