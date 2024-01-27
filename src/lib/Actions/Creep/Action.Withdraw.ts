import { Action } from "../../Action";
import { all, remove } from "lodash";
//import { AddResourceReservation, GetPostReservationStore, Reserves } from "../../utils/Reservations/ResourceReservations";
import { ReservingAction } from "../../Reservations/ReservationAction";
import { ResourceReservation } from "../../Reservations/ResourceReservations";

export const WITHDRAW_ID = "W";

export class WithdrawAction extends ReservingAction<ResourceReservation> {
  Name: string = "Withdraw";
  Chat: string = "📤";

  TargetId: Id<AnyStoreStructure | Ruin>;
  ReservationId? : string;

  get Target(): AnyStoreStructure | Ruin | null {
    return Game.getObjectById(this.TargetId);
  }

  ResourceType: ResourceConstant;

  constructor(target: AnyStoreStructure | Ruin, resource: ResourceConstant = RESOURCE_ENERGY, creep : Creep | undefined = undefined) {
    super();
    this.TargetId = target.id;
    this.ResourceType = resource;
    if(creep)
    {
      //this.ReservationId = AddResourceReservation(creep,target,resource, Math.min(0,-1 * Math.min(creep.store.getFreeCapacity(resource),GetPostReservationStore(target,resource).used)));
    }
  }

  isComplete: (runner: RoomObject) => boolean = (creep: RoomObject) => {
    if (creep instanceof Creep) {
      let target = this.Target;
      if (!target) {
        return true;
      }
      return creep.store.getFreeCapacity(this.ResourceType) == 0;// || GetPostReservationStore(target,this.ResourceType).used <= 0;
    }
    throw new Error("Withdraw Actions are invalid on Non-Creeps");
  };

  cleanup(creep : Creep) : void {
    //remove(creep.memory.activeReservations, (s) => s === this.ReservationId);
  };

  run: (runner: RoomObject) => ScreepsReturnCode = (creep: RoomObject) => {
    if (creep instanceof Creep) {
      let target = this.Target;
      return target ? creep.withdraw(target, this.ResourceType) : ERR_INVALID_TARGET;
    }
    throw new Error("Withdraw Actions are invalid on Non-Creeps");
  };
  toJSON: () => string = () => {
    return WITHDRAW_ID + ":" + this.TargetId + "," + this.ResourceType + "," + this.ReservationId;
  };

  static fromJSON(data: string) {
    let components = data.split(",", 3);
    let target = components[0] as Id<AnyStoreStructure | Ruin>;
    let resource = components[1] as ResourceConstant;
    let reservationId = components[2];
    let actualTarget = Game.getObjectById(target);
    if (actualTarget) {
      let withdrawAction = new WithdrawAction(actualTarget, resource);
      if(reservationId && reservationId.length > 0)
      {
        withdrawAction.ReservationId = reservationId;
      }
      return withdrawAction;
    }
    return null;
  }
}
