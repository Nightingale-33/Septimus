import { ReservingAction } from "../../Reservations/ReservationAction";
import { ResourceReservation } from "../../Reservations/ResourceReservations";
import { moveTo } from "screeps-cartographer";
import { AbstractCreep } from "../../Planning/AbstractCreep";
import { MovementRoomCallback } from "../../../utils/MovementUtils";
import { log } from "utils/Logging/Logger";

export const WITHDRAW_ID = "W";

export class WithdrawAction extends ReservingAction<ResourceReservation> {
  Name: string = "Withdraw";
  Chat: string = "📤";

  TargetId: Id<AnyStoreStructure | Ruin | Tombstone>;

  get Target(): AnyStoreStructure | Ruin | Tombstone | null {
    return Game.getObjectById(this.TargetId);
  }

  pos: RoomPosition;

  ResourceType: ResourceConstant;

  waitNearIfNotEnough : Boolean;

  constructor(target: AnyStoreStructure | Ruin | Tombstone, resource: ResourceConstant = RESOURCE_ENERGY, creep : Creep | AbstractCreep | undefined = undefined,waitNearForFull : Boolean = true) {
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
    this.waitNearIfNotEnough = waitNearForFull;
  }

  isValid(creep: Creep): boolean {
    return this.Target !== null && creep.store.getFreeCapacity(this.ResourceType) > 0 && (this.Target.store.getUsedCapacity(this.ResourceType) ?? 0) > 0;
  }

  run(creep: Creep) : boolean {
    let target = this.Target;
    if(!target)
    {
      return false;
    }
    if(this.pos)
    {
      let range = creep.pos.getRangeTo(this.pos);
      let avoidCreeps = false; // < 5;

      let targetRange = 1;
      if(this.waitNearIfNotEnough && (target.store?.getUsedCapacity(this.ResourceType) ?? 0) < creep.store.getFreeCapacity(this.ResourceType))
      {
        log(1,`Creep: ${creep.name} is waiting near the withdraw target due to: ${target.store?.getUsedCapacity(this.ResourceType) ?? 0} < ${creep.store.getFreeCapacity(this.ResourceType)}`);
        targetRange = 5;
      }

      moveTo(creep,{pos:this.pos,range:targetRange},{priority:100 + 1000/range,avoidCreeps:avoidCreeps, visualizePathStyle:{stroke:"#00009F"}, roomCallback:MovementRoomCallback, swampCost:5, plainCost:2},{avoidCreeps:true,priority:1000*range});
    }
    return (target ? creep.withdraw(target, this.ResourceType) : ERR_INVALID_TARGET) == OK;
  };

  toJSON: () => string = () => {
    return WITHDRAW_ID + ":" + this.TargetId + "," + this.ResourceType + "," + this.ReservationId + "," + this.waitNearIfNotEnough;
  };

  static fromJSON(data: string) {
    let components = data.split(",", 4);
    let target = components[0] as Id<AnyStoreStructure | Ruin>;
    let resource = components[1] as ResourceConstant;
    let reservationId = components[2];
    let waiting = components[3] === "true";
    let actualTarget = Game.getObjectById(target);
    if (actualTarget) {
      let withdrawAction = new WithdrawAction(actualTarget, resource);
      if(reservationId && reservationId.length > 0)
      {
        withdrawAction.ReservationId = reservationId;
      }
      withdrawAction.waitNearIfNotEnough = waiting;
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
