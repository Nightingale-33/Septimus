import { Delegation } from "../../lib/Delegation";
import { Province } from "../Province";
import { flatten, max, min } from "lodash";
import { WORKER } from "../../lib/Roles/Role.Worker";
import { Behaviour, Planner } from "../../lib/Planning/Planner";
import { Action } from "lib/Action";
import { AbstractCreep } from "lib/Planning/AbstractCreep";
import { EnergyAcquisitionBehaviour } from "../../lib/Planning/Behaviours/EnergyAcquisition";
import { RepairAction } from "../../lib/Actions/Creep/Action.Repair";
import { RepairReservation } from "../../lib/Reservations/RepairReservations";
import { IdleAction } from "../../lib/Actions/Creep/Action.Idle";
import { log } from "../../utils/Logging/Logger";

export class RepairingManager extends Delegation implements Behaviour {
  name: string = "RepairingManager";
  province: Province;

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
      //Repair
      let repairableNow = this.repairables.filter((cs) => RepairReservation.GetPostReservationHits(cs) < (cs instanceof StructureRampart ? this.rampartHpThreshold(cs) : cs.hitsMax));
      if (repairableNow.length === 0) {
        return null;
      }
      let bestSite = min(repairableNow, (cs) => RepairReservation.GetPostReservationHits(cs) / cs.hitsMax);
      log(1, `Planning to Repair: ${bestSite.id} at: ${bestSite.pos?.toJSON()}`);
      return new RepairAction(bestSite, creep);

    }
  }

  get Id(): string {
    return this.province.name + "_" + this.name;
  }

  rampartHpThreshold(s: StructureRampart): number {
    let controllerLevel = this.province.Capital.controller?.level ?? 0;
    return (10_000 * (controllerLevel));
  }

  get repairables(): Structure[] {
    return global.cache.UseValue(() => flatten(this.province.structures.filter((s) => s instanceof StructureRampart ? s.hits < this.rampartHpThreshold(s) : s.hits < s.hitsMax * 0.75)), 0, "Repair" + this.province.name + "Structures");
  }

  ShouldExecute(): boolean {
    let totalRepairs = this.repairables.length;
    return totalRepairs > 0;
  }

  Execute(): void {
    //Determine how many repairers (Workers)
    let creeps = this.province.RequestParts([WORKER], WORK, this.repairables.length, this.Id, this.repairables.length * 2, { stealCreeps: true });

    for (const repairable of this.repairables) {
      repairable.room.visual.circle(repairable.pos, { fill: "#550055", radius: 0.1 });
    }

    //Make them do their job
    for (const creep of creeps) {
      this.Planner.Plan(creep);
    }
  }

}
