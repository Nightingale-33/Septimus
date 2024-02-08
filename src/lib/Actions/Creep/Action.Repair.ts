import { ReservingAction } from "../../Reservations/ReservationAction";
import { RepairReservation } from "../../Reservations/RepairReservations";
import { countBy } from "lodash";
import { moveTo } from "screeps-cartographer";
import { AbstractCreep } from "../../Planning/AbstractCreep";
import { CountParts } from "../../../utils/CreepUtils";
import { MovementRoomCallback } from "../../../utils/MovementUtils";

export const REPAIR_ID: string = "R";

export class RepairAction extends ReservingAction<RepairReservation> {

  Chat: string = "🔧";
  Name: string = "Repair";

  TargetId: Id<Structure>;

  get Target(): Structure | null {
    return Game.getObjectById(this.TargetId);
  }

  pos: RoomPosition;

  constructor(structure: Structure, creep : Creep | AbstractCreep | undefined = undefined) {
    let reservation : RepairReservation | undefined = undefined;
    if(creep)
    {
      let reservationAmount = Math.max(0,Math.min(creep.store.getUsedCapacity(RESOURCE_ENERGY) * REPAIR_POWER, structure.hitsMax - structure.hits));
      reservation = new RepairReservation(creep,structure,reservationAmount);
    }
    super(reservation);
    this.TargetId = structure.id;
    this.pos = structure.pos;
  }

  toJSON(): string {
    return REPAIR_ID + ":" + this.TargetId + "," + this.ReservationId;
  }

  static fromJSON(data: string) {
    let components = data.split(",",2);
    let id = components[0] as Id<Structure>;
    let reservationId = components[1];
    let target = Game.getObjectById(id);
    if (target) {
      let repairAction =  new RepairAction(target);
      if(reservationId && reservationId.length > 0)
      {
        repairAction.ReservationId = reservationId;
      }
      return repairAction;
    } else {
      return null;
    }
  }

  isValid(creep: Creep): boolean {
    return this.Target !== null && creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0 && this.Target.hits < this.Target.hitsMax;
  }

  run(creep: Creep): boolean {
    let target = this.Target;
    if(this.pos)
    {
      let range = creep.pos.getRangeTo(this.pos);
      moveTo(creep,{pos:this.pos,range:3},{priority:15/range,avoidCreeps:false, roomCallback:MovementRoomCallback}, {avoidCreeps:true, priority: 250});
    }
    let result = target ? creep.repair(target) : ERR_INVALID_TARGET;
    if (target && result == OK) {
      let thisReservation = Memory.RepairResv[target.id]?.find((r) => r.reservationId == this.ReservationId);
      if(thisReservation)
      {
        let creepWorkParts = CountParts(creep)[WORK];
        thisReservation.amount = Math.max(0,thisReservation.amount - creepWorkParts * REPAIR_POWER);
      }
    }
    return result == OK;
  }

  ApproxTimeLeft(creep: AbstractCreep): number {
    if(!this.Target)
    {
      return 0;
    }
    let creepWorkParts = countBy(creep.body, (bpd) => bpd.type)[WORK];
    let remainingEnergy = creep.store.getUsedCapacity(RESOURCE_ENERGY);
    let fullExpenditure = Math.ceil(remainingEnergy / (creepWorkParts));
    let progress = (this.Target.hitsMax - this.Target.hits) / (creepWorkParts * REPAIR_POWER);
    let expected = Math.min(progress,fullExpenditure);
    let travel = Math.max(0,Math.max(this.pos?.getRangeTo(creep.pos) ?? 0,3) - 3);
    return travel + expected;
  }

  apply(ac: AbstractCreep) {
    ac.pos = this.pos;
    let finalEnergy = this.Reservation ? ac.store.getUsedCapacity(RESOURCE_ENERGY) - Math.ceil(this.Reservation.amount / REPAIR_POWER) : 0;
    ac.store.setUsed(RESOURCE_ENERGY,finalEnergy);
  }
}
