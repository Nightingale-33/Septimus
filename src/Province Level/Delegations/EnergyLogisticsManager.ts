import { Delegation } from "../../lib/Delegation";
import { Province } from "../Province";
import { flatten, sortBy, sum } from "lodash";
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
import { LOG_FLAG } from '../../utils/Logging/FlagDecs';
import { WORKER } from "lib/Roles/Role.Worker";
import { Role } from "lib/Roles/Role";

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
    } else if(this.province.FocalPoint)
    {
      return this.province.FocalPoint;
    } else
    {
      log(0,"Unable to resolve Storage Pos");
      return this.province.spawns[0].pos;
    }
  }

  Interrupt(creep: AbstractCreep, afterFirst : AbstractCreep | undefined, nextAction: Action | undefined): Action | null {
    let creepFree = creep.store.getFreeCapacity(RESOURCE_ENERGY);
    if(creepFree > 0)
    {
      if(!(nextAction instanceof PickupAction))
      {
        let adjacentDropped = creep.pos.findInRange(FIND_DROPPED_RESOURCES,1,{filter: (d) => d.amount >= creepFree});
        if(adjacentDropped.length > 0)
        {
          return new PickupAction(adjacentDropped[0]);
        }
      } else if(afterFirst && !afterFirst.pos.isNearTo(creep.pos) && afterFirst.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
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
    }
    return null;
  }

  PlanNext(creep: AbstractCreep): Action | null {
    // if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0 && creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    //   //Consider whether to empty or refill
    //   let distanceSources= this.sources.filter((s) => ResourceReservation.GetPostReservationStore(s,RESOURCE_ENERGY).used > 0).map((s) => [s,s.pos.getMultiRoomRangeTo(creep.pos)] as [AnyStoreStructure|Resource,number]);
    //   let distanceSinks = this.sinks.filter((s) => ResourceReservation.GetPostReservationStore(s,RESOURCE_ENERGY).free > 0).map((s) => [s,s.pos.getMultiRoomRangeTo(creep.pos)] as [AnyStoreStructure,number]);
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
      let preferredSinkOrder = this.province.Capital.Defense.ShouldExecute() ? this.defenseSinkOrder : this.sinkTypeOrder;
      let sortedSinks = sortBy(sortBy(this.sinks, (s) => s.pos.getMultiRoomRangeTo(creep.pos)),(s) => preferredSinkOrder.indexOf(s.structureType));
      for (const sink of sortedSinks) {
        if (ResourceReservation.GetPostReservationStore(sink, RESOURCE_ENERGY).free > 0) {
          fillTarget = sink;
          break;
        }
      }

      if (fillTarget !== undefined) {
        return new FillAction(fillTarget, RESOURCE_ENERGY, creep);
      }

      log(1,"Could not find anywhere to deposit energy");
    }

    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
      let sourceTarget: AnyStoreStructure | Resource | undefined = undefined;
      let sortedSources = sortBy(this.sources, (s) => s.pos.getMultiRoomRangeTo(creep.pos));
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

    log(1,"Did not find anything to do for the Energy Logistics");
    return null;
  }

  ShouldExecute(): boolean {
    return true;
  }

  defenseSinkOrder : StructureConstant[] = [STRUCTURE_TOWER,STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_STORAGE];
  sinkTypeOrder: StructureConstant[] = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_STORAGE];

  lastCreepsOwned:number = 0;
  Execute(): void {
    let carryParts = 0;
    //Figure out how many haulers we need
    let mineContainers = this.province.MiningSites
      .map((mm) => mm.container)
      .filter((c): c is StructureContainer => c instanceof StructureContainer)
      .sort((a, b) => ResourceReservation.GetPostReservationStore(b, RESOURCE_ENERGY).used - ResourceReservation.GetPostReservationStore(a, RESOURCE_ENERGY).used);

    let loosePiles = this.province.Capital.room.find(FIND_DROPPED_RESOURCES)
      .filter((s) => s.resourceType === RESOURCE_ENERGY && s.amount >= 1000);

    carryParts += sum(mineContainers.map((m) => SOURCE_CARRY_PARTS_PER_DISTANCE_OWNED * m.pos.getMultiRoomRangeTo(this.storagePos)));

    //Sources will likely later include more sources
    this.sources = [...mineContainers, ...loosePiles];

    this.sinks = this.province.Capital.room.find(FIND_STRUCTURES)
      .filter((s): s is AnyStoreStructure => this.sinkTypeOrder.includes(s.structureType))
      .sort((a, b) => this.sinkTypeOrder.indexOf(a.structureType) - this.sinkTypeOrder.indexOf(b.structureType));

    let haulable = sum(this.sources, (s) => {
      if (s instanceof Resource) {
        return s.amount;
      } else {
        return s.store.getUsedCapacity(RESOURCE_ENERGY);
      }
    });
    let sinkable = sum(this.sinks, (s) => s.store.getFreeCapacity(RESOURCE_ENERGY));
    //Cap at sinkable. Nothing to haul if nowhere to haul to
    log(8,`Haulable: ${haulable}, Sinkable: ${sinkable}`);
    haulable = Math.min(haulable, sinkable);

    let haulableCarryParts = haulable / (CARRY_CAPACITY * 2);

    carryParts = Math.max(haulableCarryParts, carryParts);

    let spawnPred = (province: Province) => {
      return this.lastCreepsOwned === 0 || (province.Capital.room.energyAvailable / province.Capital.room.energyCapacityAvailable) >= 0.75;
    };

    let wantedRoles : Role[] = [HAULER];
    if(this.province.creeps.filter(creep => creep.memory.role == HAULER).length == 0)
    {
      wantedRoles.push(WORKER);
    }

    let priority = carryParts * 10;
    if(this.province.Capital.towers.length > 0 || this.province.storage)
    {
      priority = carryParts * 1000;
    }

    let creeps = this.province.RequestParts(wantedRoles, CARRY, carryParts, this.Id, priority, { deRegisterExcess: false, spawnPredicate:spawnPred, maxCreeps: carryParts/2 });
    this.lastCreepsOwned = creeps.length;

    //Ask the haulers to do their job
    for (const creep of creeps) {
      this.planner.Plan(creep);
    }

  }

}
