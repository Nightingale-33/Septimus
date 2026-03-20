import { Action } from "lib/Action";
import { AbstractCreep } from "../AbstractCreep";
import { Behaviour } from "../Planner";
import { Province } from "../../../Province Level/Province";
import { ResourceReservation } from "../../Reservations/ResourceReservations";
import { WithdrawAction } from "../../Actions/Creep/Action.Withdraw";
import { min } from "lodash";
import { PickupAction } from "../../Actions/Creep/Action.Pickup";
import { IdleAction } from "../../Actions/Creep/Action.Idle";

export class EnergyAcquisitionBehaviour implements Behaviour {
    province : Province;

  constructor(province : Province) {
    this.province = province;
  }

  Interrupt(creep: AbstractCreep, afterFirst : AbstractCreep | undefined, nextAction: Action | undefined): Action | null {
    let creepFree = creep.store.getFreeCapacity(RESOURCE_ENERGY);
    if(creepFree > 0 && afterFirst && !(afterFirst.pos.isNearTo(creep.pos)) && afterFirst.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
    {
      let nearbyOpportunity = this.province.Logistics.sources?.filter((s) => s.pos.isNearTo(creep.pos) && ResourceReservation.GetPostReservationStore(s,RESOURCE_ENERGY,true).used >= creepFree) ?? [];
      if(nearbyOpportunity.length > 0)
      {
        let yoink = nearbyOpportunity[0];
        if(yoink instanceof Structure)
        {
          return new WithdrawAction(yoink,RESOURCE_ENERGY,creep);
        } else
        {
          return new PickupAction(yoink,creep);
        }
      }
    }
    return null;
  }

  PlanNext(creep: AbstractCreep): Action | null {
      //Restock
      //Get some energy
      //Replace with logistics network
      let storage = this.province.storage;
      let resources = creep.room?.find(FIND_DROPPED_RESOURCES, { filter: (r) => r.resourceType == RESOURCE_ENERGY && ResourceReservation.GetPostReservationStore(r, RESOURCE_ENERGY).used >= creep.store.getFreeCapacity(RESOURCE_ENERGY) }) ?? [];
      let containers = creep.room?.find(FIND_STRUCTURES, {
        filter: (s): s is StructureContainer => s instanceof StructureContainer && ResourceReservation.GetPostReservationStore(s, RESOURCE_ENERGY).used >= creep.store.getFreeCapacity(RESOURCE_ENERGY)
      }) ?? [];
      if (storage && ResourceReservation.GetPostReservationStore(storage, RESOURCE_ENERGY,true).used >= creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
        return new WithdrawAction(storage, RESOURCE_ENERGY, creep);
      }
      if (resources.length > 0) {
        let closest = min(resources, (r) => r.pos.getMultiRoomRangeTo(creep.pos));
        return new PickupAction(closest, creep);
      }
      if (containers.length > 0) {
        let closest = min(containers, (c) => c.pos.getMultiRoomRangeTo(creep.pos));
        return new WithdrawAction(closest, RESOURCE_ENERGY, creep);
      }
      return new IdleAction();
    }
}
