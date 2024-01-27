import { Reservation } from "./Reservation";

declare global {
  interface Memory {
    BuildResv: { [id: Id<ConstructionSite>] : BuildReservation[] };
  }
}

export class BuildReservation extends Reservation<Creep,ConstructionSite> {
  amount: number;

  constructor(creep: Creep, cs : ConstructionSite, amount: number) {
    super(creep,cs);
    this.amount = amount;
  }

  static GetPostReservationProgress(target: ConstructionSite): number
  {
    let progress = target.progress;

    if (!Memory.BuildResv[target.id]) {
      return progress;
    }

    for (const reservation of Memory.BuildResv[target.id]) {
      progress += reservation.amount;
    }

    return progress;
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
