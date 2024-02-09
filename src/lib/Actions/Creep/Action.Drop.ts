import { Action } from "../../Action";
import { all, remove } from "lodash";
//import { AddResourceReservation, Reserves } from "../../utils/Reservations/ResourceReservations";
import { ReservingAction } from "../../Reservations/ReservationAction";
import { ResourceReservation } from "../../Reservations/ResourceReservations";
import { moveTo } from "screeps-cartographer";
import { AbstractCreep } from "../../Planning/AbstractCreep";
import { GetRoomPositionFromJSON } from "../../Prototypes/RoomPosition";
import { MovementRoomCallback } from "../../../utils/MovementUtils";

export const DROP_ID = "L";

export class DropAction extends Action {
  Name: string = "Drop";
  Chat: string = "⬇️";

  resource : ResourceConstant;
  amount : number;

  pos: RoomPosition;

  constructor(pos: RoomPosition,resource: ResourceConstant, amount: number) {
    super();
    this.resource = resource;
    this.pos = pos;
    this.amount = amount;
  }

  isValid(creep: Creep): boolean {
    return creep.store.getUsedCapacity(this.resource) > 0;
  }

  run(creep: Creep): boolean {
    if (this.pos) {
      let avoidCreeps = creep.pos.getRangeTo(this.pos) < 5;
      moveTo(creep, { pos: this.pos, range: 1 }, { priority: 10, avoidCreeps: avoidCreeps, roomCallback:MovementRoomCallback, swampCost:5, plainCost:2 });
    }
    return (creep.drop(this.resource,this.amount) == OK);
  };

  toJSON: () => string = () => {
    return DROP_ID + ":" + this.resource + "," + this.amount + "," + this.pos.toJSON();
  };

  static fromJSON(data: string) {
    let components = data.split(",", 3);
    let resource = components[0] as ResourceConstant;
    let amount = parseInt(components[1]);
    let pos = GetRoomPositionFromJSON(components[2]);
    return new DropAction(pos,resource,amount);
  }

  ApproxTimeLeft(creep: AbstractCreep): number {
    let expected = 1;
    let travel = Math.max(this.pos?.getRangeTo(creep.pos) ?? 0,1) - 1;
    return travel + expected;
  }

  apply(ac: AbstractCreep) {
    ac.pos = this.pos;
    let finalResource = Math.max(0,ac.store.getUsedCapacity(this.resource) - this.amount);
    ac.store.setUsed(this.resource,finalResource);
  }
}
