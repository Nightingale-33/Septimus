import { Delegation } from "../../lib/Delegation";
import { Province } from "../Province";
import { Behaviour, Planner } from "../../lib/Planning/Planner";
import { Action } from "lib/Action";
import { AbstractCreep } from "lib/Planning/AbstractCreep";
import { ResourceReservation } from "../../lib/Reservations/ResourceReservations";
import { HAULER } from "../../lib/Roles/Role.Hauler";
import { WithdrawAction } from "../../lib/Actions/Creep/Action.Withdraw";
import { sortBy } from "lodash";
import { FillAction } from "../../lib/Actions/Creep/Action.Fill";

export class ExtensionRefiller extends Delegation implements Behaviour {
  name: string = "ExtensionRefiller";
  get Id(): string { return `${this.province.name}_${this.name}`; }
  province: Province;

  planner : Planner;

  constructor(province: Province) {
    super();
    this.province = province;
    this.planner = new Planner(this);
  }

  Interrupt(creep: AbstractCreep, afterFirst: AbstractCreep | undefined, nextAction: Action | undefined): Action | null {
    if(creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0 &&
      this.province.storage!.pos.isNearTo(creep.pos) &&
      ResourceReservation.GetPostReservationStore(this.province.storage!,RESOURCE_ENERGY).used > 0 &&
      !(nextAction instanceof WithdrawAction))
    {
      return new WithdrawAction(this.province.storage!,RESOURCE_ENERGY,creep);
    }
    return null;
  }

  PlanNext(creep: AbstractCreep): Action | null {
    if(!this.province.storage)
    {
      return null;
    }

    if(creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0)
    {
      //Get from Storage
      return new WithdrawAction(this.province.storage,RESOURCE_ENERGY,creep);
    } else
    {
      //Fill stuff up
      let extensionsAndSpawns = this.province.structures.filter((s) : s is (StructureSpawn | StructureExtension) => (s.structureType === STRUCTURE_EXTENSION || s.structureType === STRUCTURE_SPAWN));
      let sortedSinks = sortBy(extensionsAndSpawns, (s) => s.pos.getMultiRoomRangeTo(creep.pos));
      for (const sink of sortedSinks) {
        if (ResourceReservation.GetPostReservationStore(sink, RESOURCE_ENERGY).free > 0) {
          return new FillAction(sink,RESOURCE_ENERGY,creep);
        }
      }
    }
    return null;
  }

  ShouldExecute(): boolean {
    return this.province.storage !== null && ResourceReservation.GetPostReservationStore(this.province.storage,RESOURCE_ENERGY).used > 0;
  }

  Execute(): void {
    let energyGap = this.province.Capital.room.energyCapacityAvailable - this.province.Capital.room.energyAvailable;
    let carryParts = energyGap / (CARRY_CAPACITY * 4);
    let haulers = this.province.RequestParts([HAULER],CARRY,carryParts,this.Id,energyGap * 1000,{requestSpawn: true,stealCreeps:true,deRegisterExcess:true,spawnPredicate:(p) => p.storage !== null && ResourceReservation.GetPostReservationStore(p.storage,RESOURCE_ENERGY).used >= 300});
    for(const hauler of haulers)
    {
      let nextAction = hauler.memory.plan.peek();
      if(nextAction instanceof FillAction && nextAction.Target instanceof StructureStorage)
      {
        hauler.memory.plan.clear(hauler);
      }
      this.planner.Plan(hauler);
    }
  }

}
