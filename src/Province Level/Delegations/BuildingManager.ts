import { Delegation } from "../../lib/Delegation";
import { Province } from "../Province";
import { flatten, sortByAll, sum } from 'lodash';
import { WORKER } from "../../lib/Roles/Role.Worker";
import { BuildReservation } from "../../lib/Reservations/BuildReservations";
import { BuildAction } from "../../lib/Actions/Creep/Action.Build";
import { Behaviour, Planner } from "../../lib/Planning/Planner";
import { Action } from "lib/Action";
import { AbstractCreep } from "lib/Planning/AbstractCreep";
import { EnergyAcquisitionBehaviour } from "../../lib/Planning/Behaviours/EnergyAcquisition";
import { log } from "../../utils/Logging/Logger";

export class BuildingManager extends Delegation implements Behaviour {
  name: string = "BuildingManager";
  province: Province;

  get ConstructionSites(): ConstructionSite[] {
    return global.cache.UseValue(() => sortByAll(flatten(this.province.Prefectures.map((p) => p.constructionSites)),(cs) => BuildableStructurePriorityOrder.indexOf(cs.structureType),(cs) => ((cs.progressTotal - cs.progress)/cs.progressTotal), (cs) => this.province.FocalPoint ? cs.pos.getMultiRoomRangeTo(this.province.FocalPoint) : 0), 0, this.Id + "_Sites");
  }

  constructor(province: Province) {
    super();
    this.province = province;
    this.Planner = new Planner(this);
    this.EnergyAcquirer = new EnergyAcquisitionBehaviour(this.province);
  }

  Planner: Planner;
  EnergyAcquirer: Behaviour;

  Interrupt(creep: AbstractCreep, afterFirst: AbstractCreep | undefined, nextAction: Action | undefined): Action | null {
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
      return this.EnergyAcquirer.Interrupt(creep, afterFirst, nextAction);
    }
    return null;
  }

  PlanNext(creep: AbstractCreep): Action | null {
    let creepFree = creep.store.getFreeCapacity(RESOURCE_ENERGY);
    let creepUsed = creep.store.getUsedCapacity(RESOURCE_ENERGY);
    if (creepUsed < creepFree) {
      return this.EnergyAcquirer.PlanNext(creep);
    } else {
      //Build
      let buildable = this.ConstructionSites.filter((cs) => BuildReservation.GetPostReservationProgress(cs) < cs.progressTotal);
      if (buildable.length === 0) {
        return null;
      }
      let bestSite = buildable[0];
      return new BuildAction(bestSite, creep);
    }
  }

  get Id(): string {
    return this.province.name + "_" + this.name;
  }

  ShouldExecute(): boolean {
    let totalCS = this.ConstructionSites.length;
    return totalCS > 0;
  }

  Execute(): void {
    //Determine how many builders (Workers)
    let topPrio = this.ConstructionSites[0];
    let carryParts = Math.max(Math.ceil((topPrio.progressTotal - topPrio.progress) / (CARRY_CAPACITY)),_.sum(this.ConstructionSites,(cs) => (cs.progressTotal - cs.progress) / (CARRY_CAPACITY)));
    log(5,`${this.Id} Requesting: ${carryParts} Carry Parts for ${topPrio.pos.toJSON()}`);
    let creeps = this.province.RequestParts([WORKER], CARRY, carryParts, this.Id, this.ConstructionSites.length * 5, {
      stealCreeps: true,
      deRegisterExcess: true
    });

    //Make them do their job
    for (const creep of creeps) {
      this.Planner.Plan(creep);
    }
  }

}

export const BuildableStructurePriorityOrder : BuildableStructureConstant[] = [STRUCTURE_SPAWN, STRUCTURE_STORAGE, STRUCTURE_EXTENSION,STRUCTURE_TOWER, STRUCTURE_ROAD, STRUCTURE_LINK, STRUCTURE_WALL, STRUCTURE_CONTAINER, STRUCTURE_RAMPART, STRUCTURE_LAB, STRUCTURE_OBSERVER, STRUCTURE_POWER_SPAWN, STRUCTURE_FACTORY];
