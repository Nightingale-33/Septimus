import { Delegation } from "../../lib/Delegation";
import { Province } from "../Province";
import { flatten, max, min, pick, sortBy, sum } from "lodash";
import { ResourceReservation } from "../../lib/Reservations/ResourceReservations";
import { HAULER } from "../../lib/Roles/Role.Hauler";
import { PickupAction } from "../../lib/Actions/Creep/Action.Pickup";
import { IdleAction } from "../../lib/Actions/Creep/Action.Idle";
import { WithdrawAction } from "../../lib/Actions/Creep/Action.Withdraw";
import { FillAction } from "../../lib/Actions/Creep/Action.Fill";
import { log } from "../../utils/Logging/Logger";
import { Behaviour, Planner } from "../../lib/Planning/Planner";
import { Action } from "lib/Action";
import { AbstractCreep } from "lib/Planning/AbstractCreep";
import { SOURCE_CARRY_PARTS_PER_DISTANCE_OWNED } from "../../Constants";

export class EnergyLogisticsManager extends Delegation implements Behaviour {
  name: string = "EnergyLogisticsManager";

  get Id(): string {
    return this.province.name + "_" + this.name;
  }

  storagePos : RoomPosition;
  province: Province;

  constructor(province: Province) {
    super();
    this.province = province;
    this.planner = new Planner(this);
    this.storagePos = this.ResolveStoragePos();
  }

  planner: Planner;

  sinks: AnyStoreStructure[];
  sources: (AnyStoreStructure | Resource)[];

  get SurplusEnergy(): number {
    return sum(this.sources.map((s) => ResourceReservation.GetPostReservationStore(s, RESOURCE_ENERGY).used));
  }

  ResolveStoragePos() : RoomPosition
  {
    if(this.province.storage)
    {
      return this.province.storage.pos;
    } else
    {
      return this.province.spawns[0].pos;
    }
  }

  Interrupt(creep: AbstractCreep): Action | null {
    let creepFree = creep.store.getFreeCapacity(RESOURCE_ENERGY);
    if(creepFree > 0)
    {
      let nearbyOpportunity = this.sources.filter((s) => s.pos.isNearTo(creep.pos) && ResourceReservation.GetPostReservationStore(s,RESOURCE_ENERGY).used >= creepFree);
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
    // if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0 && creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    //   //Consider whether to empty or refill
    //   let distanceSources= this.sources.filter((s) => ResourceReservation.GetPostReservationStore(s,RESOURCE_ENERGY).used > 0).map((s) => [s,s.pos.getRangeTo(creep.pos)] as [AnyStoreStructure|Resource,number]);
    //   let distanceSinks = this.sinks.filter((s) => ResourceReservation.GetPostReservationStore(s,RESOURCE_ENERGY).free > 0).map((s) => [s,s.pos.getRangeTo(creep.pos)] as [AnyStoreStructure,number]);
    //   let closestSource = min(distanceSources,(s) => s[1]);
    //   let closestSink = min(distanceSinks,(s) => s[1]);
    //   if(closestSource[0] !== undefined && closestSource[1] < closestSink[1])
    //   {
    //     if(closestSource[0] instanceof Resource)
    //     {
    //       return new PickupAction(closestSource[0],creep);
    //     } else
    //     {
    //       return new WithdrawAction(closestSource[0],RESOURCE_ENERGY,creep);
    //     }
    //   } else if(closestSink[0] !== undefined)
    //   {
    //     return new FillAction(closestSink[0],RESOURCE_ENERGY,creep);
    //   }
    // }

    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
      let fillTarget: AnyStoreStructure | undefined = undefined;
      let sortedSinks = sortBy(this.sinks, (s) => s.pos.getRangeTo(creep.pos));
      for (const sink of sortedSinks) {
        if (ResourceReservation.GetPostReservationStore(sink, RESOURCE_ENERGY).free > 0) {
          fillTarget = sink;
          break;
        }
      }

      if (fillTarget !== undefined) {
        return new FillAction(fillTarget, RESOURCE_ENERGY, creep);
      }
    }

    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
      let sourceTarget: AnyStoreStructure | Resource | undefined = undefined;
      let sortedSources = sortBy(this.sources, (s) => s.pos.getRangeTo(creep.pos));
      for (const source of sortedSources) {
        if (ResourceReservation.GetPostReservationStore(source, RESOURCE_ENERGY).used >= creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
          sourceTarget = source;
          break;
        }
      }

      if (sourceTarget === undefined) {
        return new IdleAction();
      }

      if (sourceTarget instanceof Resource) {
        return new PickupAction(sourceTarget, creep);
      } else if (sourceTarget instanceof Structure) {
        return new WithdrawAction(sourceTarget, RESOURCE_ENERGY, creep);
      } else {
        throw new Error("Tried to retrieve from non-source");
      }
    }

    return null;
  }

  ShouldExecute(): boolean {
    return true;
  }

  lastCreepsOwned:number = 0;
  Execute(): void {
    let carryParts = 0;
    //Figure out how many haulers we need
    let mineContainers = this.province.MiningSites
      .map((mm) => mm.container)
      .filter((c): c is StructureContainer => c instanceof StructureContainer)
      .sort((a, b) => ResourceReservation.GetPostReservationStore(b, RESOURCE_ENERGY).used - ResourceReservation.GetPostReservationStore(a, RESOURCE_ENERGY).used);

    carryParts += sum(mineContainers.map((m) => SOURCE_CARRY_PARTS_PER_DISTANCE_OWNED * m.pos.getRangeTo(this.storagePos)))/5;

    let droppedResources = flatten(this.province.Prefectures.map((p) => p.room.find(FIND_DROPPED_RESOURCES, { filter: (r) => r.amount >= 1000 })));

    //Sources will likely later include more sources
    this.sources = [...mineContainers, ...droppedResources];

    const sinkTypes: StructureConstant[] = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_STORAGE];
    this.sinks = this.province.Capital.room.find(FIND_STRUCTURES)
      .filter((s): s is AnyStoreStructure => sinkTypes.includes(s.structureType))
      .sort((a, b) => sinkTypes.indexOf(a.structureType) - sinkTypes.indexOf(b.structureType));

    let haulable = sum(this.sources, (s) => {
      if (s instanceof Resource) {
        return s.amount;
      } else {
        return s.store.getUsedCapacity(RESOURCE_ENERGY);
      }
    });
    let sinkable = sum(this.sinks, (s) => s.store.getFreeCapacity(RESOURCE_ENERGY));
    //Cap at sinkable. Nothing to haul if nowhere to haul to
    haulable = Math.min(haulable, sinkable);

    let haulableCarryParts = haulable / (CARRY_CAPACITY * 5);

    carryParts = Math.min(haulableCarryParts, carryParts);

    let spawnPred = (province: Province) => {
      return this.lastCreepsOwned === 0 || (province.Capital.room.energyAvailable / province.Capital.room.energyCapacityAvailable) >= 0.75;
    };
    let creeps = this.province.RequestParts([HAULER], CARRY, carryParts, this.Id, carryParts * 10, { deRegisterExcess: false, spawnPredicate:spawnPred });
    this.lastCreepsOwned = creeps.length;

    //Ask the haulers to do their job
    for (const creep of creeps) {
      this.planner.Plan(creep);
    }

  }

}
