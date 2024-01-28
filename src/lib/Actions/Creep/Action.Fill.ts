import { Action } from "../../Action";
import { all, remove } from "lodash";
//import { AddResourceReservation, GetPostReservationStore, Reserves } from "../../utils/Reservations/ResourceReservations";
import { ReservingAction } from "../../Reservations/ReservationAction";
import { ResourceReservation } from "../../Reservations/ResourceReservations";

export const FILL_ID = "F";

export class FillAction extends ReservingAction<ResourceReservation> {
  Name: string = "Fill";
  Chat: string = "🪣";

  TargetId: Id<AnyStoreStructure>;

  get Target(): AnyStoreStructure | null {
    return Game.getObjectById(this.TargetId);
  }

  ResourceType: ResourceConstant;

  constructor(target: AnyStoreStructure, resource: ResourceConstant = RESOURCE_ENERGY, creep: Creep | undefined = undefined) {
    let reservation: ResourceReservation | undefined = undefined;
    if (creep) {
      let reservationAmount = Math.max(0, Math.min(creep.store.getUsedCapacity(resource), ResourceReservation.GetPostReservationStore(target, resource).free));
      reservation = new ResourceReservation(creep, target, reservationAmount, resource);
    }
    super(reservation);

    this.TargetId = target.id;
    this.ResourceType = resource;
  }

  isComplete: (runner: RoomObject) => boolean = (creep: RoomObject) => {
    if (creep instanceof Creep) {
      let target = this.Target;
      if (!target) {
        return true;
      }
      return creep.store.getUsedCapacity(this.ResourceType) == 0;// || GetPostReservationStore(target,this.ResourceType).free <= 0;
    }
    throw new Error("Fill Actions are invalid on Non-Creeps");
  };

  run: (creep: Creep) => ScreepsReturnCode = (creep: Creep) => {
    let target = this.Target;
    return target ? creep.transfer(target, this.ResourceType) : ERR_INVALID_TARGET;
  };

  toJSON: () => string = () => {
    return FILL_ID + ":" + this.TargetId + "," + this.ResourceType + "," + this.ReservationId;
  };

  static fromJSON(data: string) {
    let components = data.split(",", 3);
    let target = components[0] as Id<AnyStoreStructure>;
    let resource = components[1] as ResourceConstant;
    let reservationId = components[2];
    let actualTarget = Game.getObjectById(target);
    if (actualTarget) {
      let fillAction = new FillAction(actualTarget, resource);
      if (reservationId && reservationId.length > 0) {
        fillAction.ReservationId = reservationId;
      }
      return fillAction;
    }
    return null;
  }
}
