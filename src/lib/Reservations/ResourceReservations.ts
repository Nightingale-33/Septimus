import { Reservation } from "./Reservation";
import { remove } from "lodash";
import { AbstractCreep } from "../Planning/AbstractCreep";

declare global {
  interface Memory {
    RsrcResv: { [id: Id<any>]: ResourceReservation[] };
  }
}

export class ResourceReservation extends Reservation<Creep | AbstractCreep, _HasId & ({ store: StoreDefinition } | {
  amount: number
})> {
  resourceType: ResourceConstant;

  constructor(reserver: Creep | AbstractCreep, reservee: _HasId & ({ store: StoreDefinition } | {
    amount: number
  }), amount: number, resourceType: ResourceConstant = RESOURCE_ENERGY) {
    super(reserver, reservee, amount);
    this.resourceType = resourceType;
  }

  static AddReservation(reservation: ResourceReservation) {
    if (!Memory.RsrcResv[reservation.reserved]) {
      Memory.RsrcResv[reservation.reserved] = [];
    }
    if (!Memory.RsrcResv[reservation.reserved].find((r) => r.reservationId === reservation.reservationId)) {
      Memory.RsrcResv[reservation.reserved].push(reservation);
      let reserver = Game.getObjectById(reservation.reserver);
      if (reserver instanceof Creep) {
        reserver.memory.activeReservations.push(reservation.reservationId);
      } else {
        throw new Error("Attempting to reserve with a non-existent reseserver");
      }
    }
  }

  static CheckMemory(target: _HasId): boolean {
    if (!Memory.RsrcResv) {
      Memory.RsrcResv = {};
    }

    if (!Memory.RsrcResv[target.id]) {
      return false;
    }

    return true;
  }

  private static HasStore<T extends object>(obj: T): obj is T & { store: StoreDefinition } {
    return obj !== undefined && "store" in obj;
  }

  static GetPostReservationStore(target: _HasId & ({ store: StoreDefinition } | {
    amount: number
  }), resourceType: ResourceConstant)
    : { free: number, used: number } {
    let storeContents: { used: number; free: number };
    if (this.HasStore(target)) {
      storeContents = {
        free: target.store.getFreeCapacity(resourceType),
        used: target.store.getUsedCapacity(resourceType)
      };
    } else {
      storeContents = { free: Infinity, used: target.amount };
    }

    if (!this.CheckMemory(target)) {
      return storeContents;
    }

    for (const reservation of Memory.RsrcResv[target.id]) {
      if (reservation.resourceType == resourceType) {
        storeContents.free -= reservation.amount;
        storeContents.used += reservation.amount;
      }
    }

    return storeContents;
  }

  static Cleanup() {
    for (const idStr of Object.keys(Memory.RsrcResv)) {
      let id = idStr as Id<any>;
      if (!Game.getObjectById(id)) {
        delete Memory.RsrcResv[id];
      }

      remove(Memory.RsrcResv[id], (reservation) => {
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
