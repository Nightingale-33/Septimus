import { Action } from "../Action";
import { Reservation } from "./Reservation";

export class ReservingAction<T extends Reservation> extends Action {

  cleanup(creep: Creep) {
    super.cleanup(creep);

  }

}
