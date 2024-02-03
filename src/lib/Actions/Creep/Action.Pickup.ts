import { Action } from "../../Action";
import { all, remove } from "lodash";
//import { AddResourceReservation, Reserves } from "../../utils/Reservations/ResourceReservations";
import { ReservingAction } from "../../Reservations/ReservationAction";
import { ResourceReservation } from "../../Reservations/ResourceReservations";

export const PICKUP_ID = "P";

export class PickupAction extends ReservingAction<ResourceReservation> {
  Name: string = "Pickup";
  Chat: string = "🫳";

  TargetId : Id<Resource>;

  get Target(): Resource | null {
    return Game.getObjectById(this.TargetId);
  };

  constructor(target: Resource, creep : Creep | undefined = undefined) {
    let reservation : ResourceReservation | undefined = undefined;
    if(creep)
    {
      let reservationAmount = Math.min(0,-1 * Math.min(creep.store.getFreeCapacity(target.resourceType),target.amount));
      reservation = new ResourceReservation(creep,target,reservationAmount,target.resourceType);
    }
    super(reservation);
    this.TargetId = target.id;
  }

  isValid(creep: Creep): boolean {
    return this.Target !== null && creep.pos.isNearTo(this.Target) && creep.store.getFreeCapacity(this.Target.resourceType) > 0 && this.Target.amount > 0;
  }

  run(creep: Creep) : boolean {
      let target = this.Target;
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
      if(reservationId && reservationId.length > 0)
      {
        pickupAction.ReservationId = reservationId;
      }
      return pickupAction;
    }
    return null;
  }

  ApproxTimeLeft(creep: Creep): number {
    return 1;
  }
}
