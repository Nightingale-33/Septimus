import { ReservingAction } from "../../Reservations/ReservationAction";
import { ResourceReservation } from "../../Reservations/ResourceReservations";
import { moveTo } from "screeps-cartographer";
import { AbstractCreep } from "../../Planning/AbstractCreep";
import { MovementRoomCallback } from "../../../utils/MovementUtils";

export const WITHDRAW_ID = "W";

export class WithdrawAction extends ReservingAction<ResourceReservation> {
  Name: string = "Withdraw";
  Chat: string = "📤";

  TargetId: Id<AnyStoreStructure | Ruin>;

  get Target(): AnyStoreStructure | Ruin | null {
    return Game.getObjectById(this.TargetId);
  }

  pos: RoomPosition;

  ResourceType: ResourceConstant;

  constructor(target: AnyStoreStructure | Ruin, resource: ResourceConstant = RESOURCE_ENERGY, creep : Creep | AbstractCreep | undefined = undefined) {
    let reservation : ResourceReservation | undefined = undefined;
    if(creep)
    {
      let reservationAmount = Math.min(0,-1 * Math.min(creep.store.getFreeCapacity(resource),ResourceReservation.GetPostReservationStore(target,resource).used));
      reservation = new ResourceReservation(creep,target,reservationAmount,resource);
    }
    super(reservation);
    this.TargetId = target.id;
    this.pos = target.pos;
    this.ResourceType = resource;
  }

  isValid(creep: Creep): boolean {
    return this.Target !== null && creep.store.getFreeCapacity(this.ResourceType) > 0 && ResourceReservation.GetPostReservationStore(this.Target,this.ResourceType).free > 0;
  }

  run(creep: Creep) : boolean {
    let target = this.Target;
    if(this.pos)
    {
      let range = creep.pos.getRangeTo(this.pos);
      let avoidCreeps = false; // < 5;
      moveTo(creep,{pos:this.pos,range:1},{priority:1000/range,avoidCreeps:avoidCreeps, visualizePathStyle:{stroke:"#00009F"}, roomCallback:MovementRoomCallback, swampCost:5, plainCost:2},{avoidCreeps:true,priority:1000*range});
    }
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

  ApproxTimeLeft(creep: AbstractCreep): number {
    let expected = 1;
    let travel = Math.max(this.pos?.getMultiRoomRangeTo(creep.pos) ?? 0,1) - 1;
    return travel + expected;
  }

  apply(ac: AbstractCreep) {
    ac.pos = this.pos;
    let finalEnergy = this.Reservation ? ac.store.getUsedCapacity(RESOURCE_ENERGY) + Math.abs(this.Reservation.amount) : ac.store.getCapacity(RESOURCE_ENERGY);
    ac.store.setUsed(RESOURCE_ENERGY,finalEnergy);
  }
}
