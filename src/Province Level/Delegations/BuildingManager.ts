import { Delegation } from "../../lib/Delegation";
import { Province } from "../Province";
import { flatten, min } from "lodash";
import { WORKER } from "../../lib/Roles/Role.Worker";
import { MoveAction } from "../../lib/Actions/Creep/Action.Move";
import { WithdrawAction } from "../../lib/Actions/Creep/Action.Withdraw";
import { PickupAction } from "../../lib/Actions/Creep/Action.Pickup";
import { ResourceReservation } from "../../lib/Reservations/ResourceReservations";
import { BuildReservation } from "../../lib/Reservations/BuildReservations";
import { BuildAction } from "../../lib/Actions/Creep/Action.Build";

export class BuildingManager extends Delegation
{
    name: string = "BuildingManager";
    province : Province;

    get ConstructionSites() : ConstructionSite[] {return global.cache.UseValue(() => flatten(this.province.Prefectures.map((p) => p.room.find(FIND_MY_CONSTRUCTION_SITES))),0,this.Id+"_Sites")}

    constructor(province : Province) {
      super();
      this.province = province;
    }

    get Id(): string {return this.province.name + "_" + this.name}
    ShouldExecute(): boolean {
      let totalCS = this.ConstructionSites.length;
      return totalCS > 0;
    }
    Execute(): void {
      //Determine how many builders (Workers)
      let creeps = this.province.RequestCreeps(WORKER,this.ConstructionSites.length,this.Id,this.ConstructionSites.length);

      //Make them do their job
      for(const creep of creeps)
      {
        let plan = creep.memory.plan;

        let creepFree = creep.store.getFreeCapacity(RESOURCE_ENERGY);
        let creepUsed = creep.store.getUsedCapacity(RESOURCE_ENERGY);
        if(creepUsed < creepFree && plan.Steps.length < 3)
        {
          //Restock
          //Get some energy
          //Replace with logistics network
          let storage = this.province.storage;
          let resources = creep.room.find(FIND_DROPPED_RESOURCES, { filter: (r) => r.resourceType == RESOURCE_ENERGY && ResourceReservation.GetPostReservationStore(r,RESOURCE_ENERGY).used >= creepFree });
          let containers = creep.room.find(FIND_STRUCTURES, {
            filter: (s): s is StructureContainer => s instanceof StructureContainer && ResourceReservation.GetPostReservationStore(s,RESOURCE_ENERGY).used >= creepFree
          });
          if(storage && ResourceReservation.GetPostReservationStore(storage,RESOURCE_ENERGY).used >= creepFree)
          {
            let move = new MoveAction(storage,1);
            let withdraw = new WithdrawAction(storage,RESOURCE_ENERGY,creep);
            plan.append(move);
            plan.append(withdraw);
            continue;
          }
          if(resources.length > 0)
          {
            let closest = min(resources,(r) => r.pos.getRangeTo(creep.pos));
            let move = new MoveAction(closest,1);
            let pickup = new PickupAction(closest,creep);
            plan.append(move);
            plan.append(pickup);
            continue;
          }
          if(containers.length > 0)
          {
            let closest = min(containers,(c) => c.pos.getRangeTo(creep.pos));
            let move = new MoveAction(closest,1);
            let withdraw = new WithdrawAction(closest,RESOURCE_ENERGY,creep);
            plan.append(move);
            plan.append(withdraw);
            continue;
          }
        } else if(!(plan.peek() instanceof BuildAction) && !(plan.peek() instanceof MoveAction))
        {
          //Build
          let bestSite = min(this.ConstructionSites.filter((cs) => BuildReservation.GetPostReservationProgress(cs) < cs.progressTotal),(cs) => cs.progressTotal - BuildReservation.GetPostReservationProgress(cs));
          if(!creep.pos.inRangeTo(bestSite.pos,3))
          {
            let move = new MoveAction(bestSite,3,true);
            plan.append(move);
          }
          let build = new BuildAction(bestSite,creep);
          plan.append(build);
        }
      }
    }

}
