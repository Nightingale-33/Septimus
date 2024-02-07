import { Delegation } from "../../lib/Delegation";
import { Province } from "../Province";
import { flatten, max, min } from "lodash";
import { WORKER } from "../../lib/Roles/Role.Worker";
import { BuildReservation } from "../../lib/Reservations/BuildReservations";
import { BuildAction } from "../../lib/Actions/Creep/Action.Build";
import { Behaviour, Planner } from "../../lib/Planning/Planner";
import { Action } from "lib/Action";
import { AbstractCreep } from "lib/Planning/AbstractCreep";
import { EnergyAcquisitionBehaviour } from "../../lib/Planning/Behaviours/EnergyAcquisition";

export class BuildingManager extends Delegation implements Behaviour {
  name: string = "BuildingManager";
  province: Province;

  get ConstructionSites(): ConstructionSite[] {
    return global.cache.UseValue(() => flatten(this.province.Prefectures.map((p) => p.room.find(FIND_MY_CONSTRUCTION_SITES))), 0, this.Id + "_Sites");
  }

  constructor(province: Province) {
    super();
    this.province = province;
    this.Planner = new Planner(this);
    this.EnergyAcquirer = new EnergyAcquisitionBehaviour(this.province);
  }

  Planner: Planner;
  EnergyAcquirer: Behaviour;

  Interrupt(creep: AbstractCreep, afterFirst : AbstractCreep | undefined, nextAction: Action | undefined): Action | null {
    if(creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
    {
      return this.EnergyAcquirer.Interrupt(creep,afterFirst,nextAction);
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
      let bestSite = min(this.ConstructionSites.filter((cs) => BuildReservation.GetPostReservationProgress(cs) < cs.progressTotal), (cs) => cs.progressTotal - BuildReservation.GetPostReservationProgress(cs));
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
    let closestToDone = max(this.ConstructionSites, (cs) => cs.progress/cs.progressTotal);
    let carryParts = Math.ceil((closestToDone.progressTotal - closestToDone.progress) / (CARRY_CAPACITY));
    let creeps = this.province.RequestParts([WORKER], CARRY, carryParts, this.Id, this.ConstructionSites.length * 5, {stealCreeps: true, deRegisterExcess: true});

    //Make them do their job
    for (const creep of creeps) {
      this.Planner.Plan(creep);
    }
  }

}
