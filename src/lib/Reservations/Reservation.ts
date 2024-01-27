export abstract class Reservation<T extends _HasId,T2 extends _HasId> {
  reservationId: string;
  reserver: Id<T>;
  reserved: Id<T2>;

  protected GetNewReservationId() : string {
    return Math.random().toString(16).slice(2);
  }


  constructor(reserver : T, reservee : T2) {
    this.reservationId = this.GetNewReservationId();
    this.reserver = reserver.id;
    this.reserved =reservee.id;
  }

}
