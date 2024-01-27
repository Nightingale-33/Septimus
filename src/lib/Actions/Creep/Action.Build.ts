import { Action } from "../../Action";
import { all, remove } from "lodash";
import { ReservingAction } from "../../Reservations/ReservationAction";
import { BuildReservation } from "../../Reservations/BuildReservations";

export const BUILD_ID: string = "B";

export class BuildAction extends ReservingAction<BuildReservation> {

  Chat: string = "🚧";
  Name: string = "Build";

  TargetId: Id<ConstructionSite>;
  ReservationId? : string;

  get Target(): ConstructionSite | null {
    return Game.getObjectById(this.TargetId);
  }

  constructor(constructionSite: ConstructionSite, creep : Creep | undefined = undefined) {
    super();
    this.TargetId = constructionSite.id;
    if(creep)
    {
      //this.ReservationId = AddBuildReservation(creep,constructionSite,Math.min(creep.store.getUsedCapacity(RESOURCE_ENERGY),constructionSite.progressTotal - constructionSite.progress));
    }
  }

  toJSON(): string {
    return BUILD_ID + ":" + this.TargetId + "," + this.ReservationId;
  }

  static fromJSON(data: string) {
    let components = data.split(",",2);
    let id = components[0] as Id<ConstructionSite>;
    let reservationId = components[1];
    let target = Game.getObjectById(id);
    if (target) {
      let buildAction = new BuildAction(target);
      if(reservationId && reservationId.length > 0)
      {
        buildAction.ReservationId = reservationId;
      }
      return buildAction;
    } else {
      return null;
    }
  }

  isComplete(creep: RoomObject): boolean {
    if (creep instanceof Creep) {
      let target = this.Target;
      if (!target) {
        return true;
      }

      return creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || target.progress >= target.progressTotal;

    }
    throw new Error("Build Actions not applicable to Non-Creeps");
  };

  cleanup(creep : Creep) : void {
    //remove(creep.memory.activeReservations, (s) => s === this.ReservationId);
  };

  run(creep: RoomObject): ScreepsReturnCode {
    if (creep instanceof Creep) {
      let target = this.Target;
      let result = target ? creep.build(target) : ERR_INVALID_TARGET;
      if(target && result == OK)
      {
        //let thisReservation = target.room?.memory.buildReservations[target.id]?.find((r) => r.reservationId == this.ReservationId);
        // if(thisReservation)
        // {
        //   let creepWorkParts = creep.body.map(bdp => bdp.type).filter(t => t == WORK).length;
        //   thisReservation.amount = Math.min(0,thisReservation.amount - creepWorkParts * BUILD_POWER);
        // }
      }
      return result;
    }
    throw new Error("Build Actions not applicable to Non-Creeps");
  }
}
