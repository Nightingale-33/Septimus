import { Reservation } from "./Reservation";
import { remove } from "lodash";
import { AbstractCreep } from "../Planning/AbstractCreep";

declare global {
  interface Memory {
    RepairResv: { [id: Id<Structure>]: RepairReservation[] };
  }
}

export class RepairReservation extends Reservation<Creep | AbstractCreep, Structure> {

  constructor(creep: Creep | AbstractCreep, str: Structure, amount: number) {
    super(creep, str, amount);
  }

  static CheckMemory(target: Structure): boolean {
    if (!Memory.RepairResv) {
      Memory.RepairResv = {};
    }

    if (!Memory.RepairResv[target.id]) {
      return false;
    }

    return true;
  }

  static AddReservation(reservation: RepairReservation) {
    if (!Memory.RepairResv[reservation.reserved]) {
      Memory.RepairResv[reservation.reserved] = [];
    }
    if (!Memory.RepairResv[reservation.reserved].find((r) => r.reservationId === reservation.reservationId)) {
      Memory.RepairResv[reservation.reserved].push(reservation);
      let reserver = Game.getObjectById(reservation.reserver);
      if (reserver instanceof Creep) {
        reserver.memory.activeReservations.push(reservation.reservationId);
      } else {
        throw new Error("Attempting to reserve with a non-existent reseserver");
      }
    }
  }

  static GetPostReservationHits(target: Structure): number {
    let hits = target.hits;

    if (!this.CheckMemory(target)) {
      return hits;
    }

    for (const reservation of Memory.RepairResv[target.id]) {
      hits += reservation.amount;
    }

    return hits;
  }

  static Cleanup() {
    for (const idStr of Object.keys(Memory.RepairResv)) {
      let id = idStr as Id<any>;
      if (!Game.getObjectById(id)) {
        delete Memory.RepairResv[id];
      }

      remove(Memory.RepairResv[id], (reservation) => {
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
