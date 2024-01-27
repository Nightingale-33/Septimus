import { Reservation } from "./Reservation";

declare global {
  interface Memory {
    RepairResv: { [id: Id<Structure>] : RepairReservation[] };
  }
}

export class RepairReservation extends Reservation<Creep,Structure> {
  amount : number;

  constructor(creep: Creep, str : Structure,amount : number) {
    super(creep,str);
    this.amount = amount;
  }
  static GetPostReservationHits(target: Structure): number
  {
    let hits = target.hits;

    if (!Memory.RepairResv[target.id]) {
      return hits;
    }

    for (const reservation of Memory.RepairResv[target.id]) {
      hits += reservation.amount;
    }

    return hits;
  }

  static Cleanup() {
    for(const idStr of Object.keys(Memory.RepairResv))
    {
      let id = idStr as Id<any>;
      if(!Game.getObjectById(id))
      {
        delete Memory.RepairResv[id];
      }
    }
  }
}
