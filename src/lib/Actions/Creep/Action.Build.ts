import { ReservingAction } from "../../Reservations/ReservationAction";
import { BuildReservation } from "../../Reservations/BuildReservations";

export const BUILD_ID: string = "B";

export class BuildAction extends ReservingAction<BuildReservation> {

  Chat: string = "🚧";
  Name: string = "Build";

  TargetId: Id<ConstructionSite>;
  ReservationId?: string;

  get Target(): ConstructionSite | null {
    return Game.getObjectById(this.TargetId);
  }

  constructor(constructionSite: ConstructionSite, creep: Creep | undefined = undefined) {
    let reservation: BuildReservation | undefined = undefined;
    if (creep) {
      let reservationAmount = Math.min(creep.store.getUsedCapacity(RESOURCE_ENERGY), constructionSite.progressTotal - constructionSite.progress);
      reservation = new BuildReservation(creep, constructionSite, reservationAmount);
    }
    super(reservation);
    this.TargetId = constructionSite.id;
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
    return this.Target !== null;
  }

  isComplete(creep: Creep): boolean {
    let target = this.Target;
    if (!target) {
      return true;
    }
    return creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || target.progress >= target.progressTotal;
  };

  run(creep: Creep): boolean {
    let target = this.Target;
    let result = target ? creep.build(target) : ERR_INVALID_TARGET;
    if (target && result == OK) {
      let thisReservation = Memory.BuildResv[target.id]?.find((r) => r.reservationId == this.ReservationId);
      if (thisReservation) {
        let creepWorkParts = creep.body.map(bdp => bdp.type).filter(t => t == WORK).length;
        thisReservation.amount = Math.min(0, thisReservation.amount - creepWorkParts * BUILD_POWER);
      }
    }
    return result == OK;
  }
}
