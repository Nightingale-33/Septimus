import { GetRandomId } from "../../utils/StringUtils";

export type reservationId = string;

export abstract class Reservation<T extends _HasId,T2 extends _HasId> {
  reservationId: reservationId;
  reserver: Id<T>;
  reserved: Id<T2>;

  protected GetNewReservationId() : string {
    return GetRandomId();
  }


  constructor(reserver : T, reservee : T2) {
    this.reservationId = this.GetNewReservationId();
    this.reserver = reserver.id;
    this.reserved =reservee.id;
  }

}
