import { Action } from "../../Action";
import { all, remove } from "lodash";
//import { AddResourceReservation, Reserves } from "../../utils/Reservations/ResourceReservations";
import { ReservingAction } from "../../Reservations/ReservationAction";
import { ResourceReservation } from "../../Reservations/ResourceReservations";
import { moveTo } from "screeps-cartographer";
import { AbstractCreep } from "../../Planning/AbstractCreep";

export const PICKUP_ID = "P";

export class PickupAction extends ReservingAction<ResourceReservation> {
  Name: string = "Pickup";
  Chat: string = "🫳";

  TargetId: Id<Resource>;

  get Target(): Resource | null {
    return Game.getObjectById(this.TargetId);
  };

  pos: RoomPosition;

  constructor(target: Resource, creep: Creep | AbstractCreep | undefined = undefined) {
    let reservation: ResourceReservation | undefined = undefined;
    if (creep) {
      let reservationAmount = Math.min(0, -1 * Math.min(creep.store.getFreeCapacity(target.resourceType), target.amount));
      reservation = new ResourceReservation(creep, target, reservationAmount, target.resourceType);
    }
    super(reservation);
    this.TargetId = target.id;
    this.pos = target.pos;
  }

  isValid(creep: Creep): boolean {
    return this.Target !== null && creep.store.getFreeCapacity(this.Target.resourceType) > 0 && this.Target.amount > 0;
  }

  run(creep: Creep): boolean {
    let target = this.Target;
    if (this.pos) {
      let avoidCreeps = creep.pos.getRangeTo(this.pos) < 5;
      moveTo(creep, { pos: this.pos, range: 1 }, { priority: 10, avoidCreeps: avoidCreeps });
    }
    return (target ? creep.pickup(target) : ERR_INVALID_TARGET) == OK;
  };

  toJSON: () => string = () => {
    return PICKUP_ID + ":" + this.TargetId + "," + this.ReservationId;
  };

  static fromJSON(data: string) {
    let components = data.split(",", 2);
    let target = components[0] as Id<Resource>;
    let reservationId = components[1];
    let actualTarget = Game.getObjectById(target);
    if (actualTarget) {
      let pickupAction = new PickupAction(actualTarget);
      if (reservationId && reservationId.length > 0) {
        pickupAction.ReservationId = reservationId;
      }
      return pickupAction;
    }
    return null;
  }

  ApproxTimeLeft(creep: AbstractCreep): number {
    let expected = 1;
    let travel = Math.max(this.pos?.getRangeTo(creep.pos) ?? 0,1) - 1;
    return travel + expected;
  }

  apply(ac: AbstractCreep) {
    ac.pos = this.pos;
    ac.store.energy = this.Reservation ? ac.store.energy - this.Reservation.amount : ac.store.getCapacity(RESOURCE_ENERGY);
  }
}
