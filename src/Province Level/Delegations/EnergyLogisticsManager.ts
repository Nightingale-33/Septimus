import { Delegation } from "../../lib/Delegation";
import { Province } from "../Province";
import { flatten, max, pick, sum } from "lodash";
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

export class EnergyLogisticsManager extends Delegation implements Behaviour {
  name: string = "EnergyLogisticsManager";

  get Id(): string {
    return this.province.name + "_" + this.name;
  }

  province: Province;

  constructor(province: Province) {
    super();
    this.province = province;
    this.planner = new Planner(10,this);
  }

  planner : Planner;

  sinks : AnyStoreStructure[];
  sources: AnyStoreStructure[];

  PlanNext(creep: AbstractCreep): Action | null {
      if (creep.store.getFreeCapacity() === 0) {
        let fillTarget: AnyStoreStructure | undefined = undefined;
        for (const sink of this.sinks) {
          if (ResourceReservation.GetPostReservationStore(sink, RESOURCE_ENERGY).free > 0) {
            fillTarget = sink;
            break;
          }
        }

        if (fillTarget === undefined) {
          return new IdleAction();
        }

        return new FillAction(fillTarget, RESOURCE_ENERGY, creep);
      } else {
        let sourceTarget: AnyStoreStructure | undefined = undefined;
        for (const source of this.sources) {
          if (ResourceReservation.GetPostReservationStore(source, RESOURCE_ENERGY).used >= creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
            sourceTarget = source;
            break;
          }
        }

        if (sourceTarget === undefined) {
          return new IdleAction();
        }

        return new WithdrawAction(sourceTarget, RESOURCE_ENERGY, creep);
      }

  }

  ShouldExecute(): boolean {
    return true;
  }

  Execute(): void {
    //Figure out how many haulers we need
    let mineContainers = this.province.MiningSites
      .map((mm) => mm.container)
      .filter((c): c is StructureContainer => c instanceof StructureContainer)
      .sort((a, b) => ResourceReservation.GetPostReservationStore(b, RESOURCE_ENERGY).used - ResourceReservation.GetPostReservationStore(a, RESOURCE_ENERGY).used);

    //Sources will likely later include more sources
    this.sources = mineContainers;

    const sinkTypes: StructureConstant[] = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_STORAGE];
    this.sinks = this.province.Capital.room.find(FIND_STRUCTURES)
      .filter((s): s is AnyStoreStructure => sinkTypes.includes(s.structureType))
      .sort((a, b) => sinkTypes.indexOf(a.structureType) - sinkTypes.indexOf(b.structureType));

    let haulable = sum(this.sources, (s) => s.store.getUsedCapacity(RESOURCE_ENERGY));
    let sinkable = sum(this.sinks, (s) => s.store.getFreeCapacity(RESOURCE_ENERGY));
    //Cap at sinkable. Nothing to haul if nowhere to haul to
    haulable = Math.min(haulable, sinkable);

    let carryParts = Math.floor(haulable / CARRY_CAPACITY);

    let creeps = this.province.RequestParts([HAULER], CARRY, carryParts, this.Id, carryParts * 10);

    //Ask the haulers to do their job
    for (const creep of creeps) {
      let plan = creep.memory.plan;
      if (plan.peek() instanceof IdleAction) {
        plan.clear(creep);
      }

      this.planner.Plan(creep);
    }

  }

}
