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
  ReservationId? : string;
  get Target(): Resource | null {
    return Game.getObjectById(this.TargetId);
  };

  constructor(target: Resource, creep : Creep | undefined = undefined) {
    super();
    this.TargetId = target.id;
    if(creep)
    {
      //this.ReservationId = AddResourceReservation(creep,target,target.resourceType, Math.min(0,-1 * Math.min(creep.store.getFreeCapacity(target.resourceType),target.amount)));
    }
  }

  isComplete: (runner: RoomObject) => boolean = (creep: RoomObject) => {
    if (creep instanceof Creep) {
      let target = this.Target;
      if (!target) {
        return true;
      }
      return creep.store.getFreeCapacity(target.resourceType) == 0 || target.amount == 0;
    }
    throw new Error("Pickup Actions are invalid on Non-Creeps");
  };

  cleanup(creep : Creep) : void {
    //remove(creep.memory.activeReservations, (s) => s === this.ReservationId);
  };

  run: (runner: RoomObject) => ScreepsReturnCode = (creep: RoomObject) => {
    if (creep instanceof Creep) {
      let target = this.Target;
      return target ? creep.pickup(target) : ERR_INVALID_TARGET;
    }
    throw new Error("Pickup Actions are invalid on Non-Creeps");
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
}
