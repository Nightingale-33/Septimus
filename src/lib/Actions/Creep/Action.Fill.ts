import { Action } from "../../Action";
import { all, remove } from "lodash";
//import { AddResourceReservation, GetPostReservationStore, Reserves } from "../../utils/Reservations/ResourceReservations";
import { ReservingAction } from "../../Reservations/ReservationAction";
import { ResourceReservation } from "../../Reservations/ResourceReservations";
import { moveTo } from "screeps-cartographer";
import { AbstractCreep } from "../../Planning/AbstractCreep";

export const FILL_ID = "F";

export class FillAction extends ReservingAction<ResourceReservation> {
  Name: string = "Fill";
  Chat: string = "🪣";

  TargetId: Id<AnyStoreStructure>;

  get Target(): AnyStoreStructure | null {
    return Game.getObjectById(this.TargetId);
  }

  pos: RoomPosition;

  ResourceType: ResourceConstant;

  constructor(target: AnyStoreStructure, resource: ResourceConstant = RESOURCE_ENERGY, creep: Creep | AbstractCreep | undefined = undefined) {
    let reservation: ResourceReservation | undefined = undefined;
    if (creep) {
      let reservationAmount = Math.max(0, Math.min(creep.store.getUsedCapacity(resource), ResourceReservation.GetPostReservationStore(target, resource).free));
      reservation = new ResourceReservation(creep, target, reservationAmount, resource);
    }
    super(reservation);

    this.TargetId = target.id;
    this.pos = target.pos;
    this.ResourceType = resource;
  }

  isValid(creep: Creep): boolean {
    return this.Target !== null && creep.store.getUsedCapacity(this.ResourceType) > 0 && (this.Target.store?.getFreeCapacity(this.ResourceType) ?? 0) > 0;
  }

  run(creep: Creep): boolean {
    let target = this.Target;
    if (this.pos) {
      let avoidCreeps = creep.pos.getRangeTo(this.pos) < 5;
      moveTo(creep, { pos: this.pos, range: 1 }, { priority: 20, avoidCreeps: avoidCreeps });
    }
    return (target ? creep.transfer(target, this.ResourceType) : ERR_INVALID_TARGET) == OK;
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

  ApproxTimeLeft(creep: AbstractCreep): number {
    let expected = 1;
    let travel = Math.max(this.pos?.getRangeTo(creep.pos) ?? 0,1) - 1;
    return travel + expected;
  }

  apply(ac: AbstractCreep) {
    ac.pos = this.pos;
    ac.store.energy = this.Reservation ? ac.store.energy - this.Reservation.amount : 0;
  }
}
