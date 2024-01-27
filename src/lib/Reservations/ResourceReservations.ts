import { Reservation } from "./Reservation";

declare global {
  interface Memory {
    RsrcResv: { [id: Id<any>] : ResourceReservation[] };
  }
}

export class ResourceReservation extends Reservation<Creep,_HasId & {store: StoreDefinition}>
{
  resourceType : ResourceConstant;
  amount : number;

  constructor(reserver : Creep, reservee : _HasId & {store: StoreDefinition}, amount: number, resourceType : ResourceConstant = RESOURCE_ENERGY) {
    super(reserver,reservee);
    this.amount = amount;
    this.resourceType = resourceType;
  }

  static GetPostReservationStore(target: _HasId & {store: StoreDefinition}, resourceType: ResourceConstant)
  : {free: number, used: number}
  {
    let storeContents = {free: target.store.getFreeCapacity(resourceType), used: target.store.getUsedCapacity(resourceType)};

    for(const reservation of Memory.RsrcResv[target.id])
    {
      if (reservation.resourceType == resourceType) {
        storeContents.free -= reservation.amount;
        storeContents.used += reservation.amount;
      }
    }

    return storeContents;
  }

  static Cleanup() {
    for(const idStr of Object.keys(Memory.RsrcResv))
    {
      let id = idStr as Id<any>;
      if(!Game.getObjectById(id))
      {
        delete Memory.RsrcResv[id];
      }
    }
  }
}
