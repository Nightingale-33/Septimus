import { ReservingAction } from "../../Reservations/ReservationAction";
import { ResourceReservation } from "../../Reservations/ResourceReservations";

export const WITHDRAW_ID = "W";

export class WithdrawAction extends ReservingAction<ResourceReservation> {
  Name: string = "Withdraw";
  Chat: string = "📤";

  TargetId: Id<AnyStoreStructure | Ruin>;

  get Target(): AnyStoreStructure | Ruin | null {
    return Game.getObjectById(this.TargetId);
  }

  ResourceType: ResourceConstant;

  constructor(target: AnyStoreStructure | Ruin, resource: ResourceConstant = RESOURCE_ENERGY, creep : Creep | undefined = undefined) {
    let reservation : ResourceReservation | undefined = undefined;
    if(creep)
    {
      let reservationAmount = Math.min(0,-1 * Math.min(creep.store.getFreeCapacity(resource),ResourceReservation.GetPostReservationStore(target,resource).used));
      reservation = new ResourceReservation(creep,target,reservationAmount,resource);
    }
    super(reservation);
    this.TargetId = target.id;
    this.ResourceType = resource;
  }

  isValid(creep: Creep): boolean {
    return this.Target !== null && creep.store.getFreeCapacity(this.ResourceType) > 0;
  }

  run(creep: Creep) : boolean {
    let target = this.Target;
    return (target ? creep.withdraw(target, this.ResourceType) : ERR_INVALID_TARGET) == OK;
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
