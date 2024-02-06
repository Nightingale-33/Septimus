import { ReservingAction } from "../../Reservations/ReservationAction";
import { BuildReservation } from "../../Reservations/BuildReservations";
import { countBy } from "lodash";
import { moveTo } from "screeps-cartographer";
import { AbstractCreep } from "../../Planning/AbstractCreep";
import { CountParts } from "../../../utils/CreepUtils";

export const BUILD_ID: string = "B";

export class BuildAction extends ReservingAction<BuildReservation> {

  Chat: string = "🚧";
  Name: string = "Build";

  TargetId: Id<ConstructionSite>;
  ReservationId?: string;

  get Target(): ConstructionSite | null {
    return Game.getObjectById(this.TargetId);
  }

  pos: RoomPosition;

  constructor(constructionSite: ConstructionSite, creep: Creep | AbstractCreep | undefined = undefined) {
    let reservation: BuildReservation | undefined = undefined;
    if (creep) {
      let reservationAmount = Math.min(creep.store.getUsedCapacity(RESOURCE_ENERGY), constructionSite.progressTotal - constructionSite.progress);
      if(reservationAmount <= 0)
      {
        throw new Error(`Negative Build Reservation: ${creep.id}, amount: ${reservationAmount}: ${JSON.stringify(creep)}`);
      }
      reservation = new BuildReservation(creep, constructionSite, reservationAmount);
    }
    super(reservation);
    this.TargetId = constructionSite.id;
    this.pos = constructionSite.pos;
  }

  toJSON(): string {
    return BUILD_ID + ":" + this.TargetId + "," + this.ReservationId;
  }

  static fromJSON(data: string) {
    let components = data.split(",", 2);
    let id = components[0] as Id<ConstructionSite>;
    let reservationId = components[1];
    let target = Game.getObjectById(id);
    if (target) {
      let buildAction = new BuildAction(target);
      if (reservationId && reservationId.length > 0) {
        buildAction.ReservationId = reservationId;
      }
      return buildAction;
    } else {
      return null;
    }
  }

  isValid(creep: Creep): boolean {
    return this.Target !== null && creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0 && this.Target.progress < this.Target.progressTotal;
  }

  run(creep: Creep): boolean {
    let target = this.Target;

    let avoidCreeps = creep.pos.getRangeTo(this.pos) < 5;
    moveTo(creep, { pos: this.pos, range: 3 }, { priority: 15, avoidCreeps: avoidCreeps });

    let result = target ? creep.build(target) : ERR_INVALID_TARGET;
    if (target && result == OK) {
      let thisReservation = Memory.BuildResv[target.id]?.find((r) => r.reservationId == this.ReservationId);
      if (thisReservation) {
        let creepWorkParts = CountParts(creep)[WORK];
        thisReservation.amount = Math.max(0, thisReservation.amount - creepWorkParts * BUILD_POWER);
      }
    }
    return result == OK;
  }

  ApproxTimeLeft(creep: AbstractCreep): number {
    if (!this.Target) {
      return 0;
    }
    let creepWorkParts = countBy(creep.body, (bpd) => bpd.type)[WORK];
    let remainingEnergy = creep.store.getUsedCapacity(RESOURCE_ENERGY);
    let fullExpenditure = Math.ceil(remainingEnergy / (creepWorkParts * BUILD_POWER));
    let progress = (this.Target.progressTotal - this.Target.progress) / (creepWorkParts * BUILD_POWER);
    let expected = Math.min(progress, fullExpenditure);
    let travel = Math.max(this.pos?.getRangeTo(creep.pos) ?? 0, 3) - 3;
    return travel + expected;
  }

  apply(ac: AbstractCreep) {
    let finalEnergy = this.Reservation ? ac.store.getUsedCapacity(RESOURCE_ENERGY) - Math.abs(this.Reservation.amount) : 0;
    ac.store.setUsed(RESOURCE_ENERGY,finalEnergy);
    ac.pos = this.pos;
  }
}
