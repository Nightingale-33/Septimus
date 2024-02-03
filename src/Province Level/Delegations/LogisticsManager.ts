import { Delegation } from "../../lib/Delegation";
import { Province } from "../Province";
import { flatten, max, pick, sum } from "lodash";
import { ResourceReservation } from "../../lib/Reservations/ResourceReservations";
import { GetLargestBody } from "../../utils/SpawnUtils";
import { SOURCE_HARVEST_PARTS } from "../../Constants";
import { HARVESTER } from "../../lib/Roles/Role.Harvester";
import { log } from "../../utils/Logging/Logger";
import { HAULER } from "../../lib/Roles/Role.Hauler";
import { PickupAction } from "../../lib/Actions/Creep/Action.Pickup";
import { IdleAction } from "../../lib/Actions/Creep/Action.Idle";
import { MoveAction } from "../../lib/Actions/Creep/Action.Move";
import { WithdrawAction } from "../../lib/Actions/Creep/Action.Withdraw";
import { FillAction } from "../../lib/Actions/Creep/Action.Fill";

export class LogisticsManager extends Delegation
{
    name: string = "LogisticsManager";
    get Id(): string { return this.province.name + "_" + this.name}

    province : Province;

    constructor(province: Province) {
      super();
      this.province = province;
    }

    ShouldExecute(): boolean {
        return true;
    }
    Execute(): void {
      //Figure out how many haulers we need
      let mineContainers = this.province.MiningSites
        .map((mm) => mm.container ? Game.getObjectById(mm.container) : null)
        .filter((c) : c is StructureContainer => c instanceof StructureContainer)
        .sort((a,b) => ResourceReservation.GetPostReservationStore(b,RESOURCE_ENERGY).used - ResourceReservation.GetPostReservationStore(a,RESOURCE_ENERGY).used);

      //Sources will likely later include more sources
      let sources = mineContainers;

      const sinkTypes : StructureConstant[] = [STRUCTURE_SPAWN, STRUCTURE_EXTENSION,STRUCTURE_STORAGE];
      let sinks = this.province.Capital.room.find(FIND_STRUCTURES)
        .filter((s) : s is AnyStoreStructure => sinkTypes.includes(s.structureType))
        .sort((a,b) => sinkTypes.indexOf(a.structureType) - sinkTypes.indexOf(b.structureType));

      let haulable = sum(sources,(s) => s.store.getUsedCapacity(RESOURCE_ENERGY));
      let sinkable = sum(sinks,(s) => s.store.getFreeCapacity(RESOURCE_ENERGY));
      //Cap at sinkable. Nothing to haul if nowhere to haul to
      haulable = Math.min(haulable,sinkable);

      let carryParts = Math.floor(haulable / CARRY_CAPACITY);

      let sufficientCarryParts = (hs : Creep[]) => flatten(hs.map((c) => c.body.map((bpd) => bpd.type).filter((bt) : bt is CARRY => bt === CARRY))).length >= carryParts;

      let creeps: Creep[] = [];
      let creepCount = 0;
      let requestAmount = 0;
      do {
        requestAmount++
        creepCount = creeps.length;
        creeps = this.province.RequestCreeps(HAULER, requestAmount, this.Id, carryParts*10, false);
      } while(!sufficientCarryParts(creeps) && creeps.length > creepCount);

      //Ask the haulers to do their job
      for(const creep of creeps)
      {
        let plan = creep.memory.plan;
        if(plan.peek() instanceof IdleAction)
        {
          plan.clear(creep);
        }
        if(!plan.isEmpty())
        {
          if(creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
          {
            let opportunityGrab = creep.pos.findInRange(FIND_DROPPED_RESOURCES,1, {filter: (dr) => dr.amount >= creep.store.getFreeCapacity(RESOURCE_ENERGY)});
            if(opportunityGrab.length > 0)
            {
              let yoink = max(opportunityGrab,(g) => g.amount);
              plan.prepend(new PickupAction(yoink,creep));
            }
          }
        } else
        {
          if(creep.store.getFreeCapacity() === 0)
          {
            let fillTarget : AnyStoreStructure | undefined = undefined;
            for(const sink of sinks)
            {
              if(ResourceReservation.GetPostReservationStore(sink,RESOURCE_ENERGY).free > 0)
              {
                fillTarget = sink;
                break;
              }
            }

            if(fillTarget === undefined)
            {
              plan.append(new IdleAction());
              continue;
            }

            let move = new MoveAction(fillTarget.pos,1,true);
            plan.append(move);
            let fill = new FillAction(fillTarget,RESOURCE_ENERGY,creep);
            plan.append(fill);
          } else
          {
            let sourceTarget : AnyStoreStructure | undefined = undefined;
            for(const source of sources)
            {
              if(ResourceReservation.GetPostReservationStore(source,RESOURCE_ENERGY).used >= creep.store.getFreeCapacity(RESOURCE_ENERGY))
              {
                sourceTarget = source;
                break;
              }
            }

            if(sourceTarget === undefined)
            {
              plan.append(new IdleAction());
              continue;
            }

            let move = new MoveAction(sourceTarget.pos,1,true);
            plan.append(move);
            let withdraw = new WithdrawAction(sourceTarget,RESOURCE_ENERGY,creep);
            plan.append(withdraw);
          }

        }
      }

    }

}
