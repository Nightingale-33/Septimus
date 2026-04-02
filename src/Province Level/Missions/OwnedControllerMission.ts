import { ProvinceMission } from "../../lib/Mission/ProvinceMission";
import { Province } from "../Province";
import { defaultsDeep } from "lodash";
import { WORKER } from "../../lib/Roles/Role.Worker";
import { log } from "../../utils/Logging/Logger";
import { UpgradeAction } from "../../lib/Actions/Creep/Action.Upgrade";
import { Behaviour, Planner } from "../../lib/Planning/Planner";
import { Action } from "lib/Action";
import { AbstractCreep } from "lib/Planning/AbstractCreep";
import { EnergyAcquisitionBehaviour } from "../../lib/Planning/Behaviours/EnergyAcquisition";


export class OwnedControllerMission extends ProvinceMission implements Behaviour {

  priority: number = 1;

  controllerId: Id<StructureController>;

  get Id() : string {
    return this.flag.name;
  }

  get controller(): StructureController | null {
    return Game.getObjectById(this.controllerId);
  }

  static GetFlagColours(): { primary: ColorConstant, secondary: ColorConstant } {
    return { primary: COLOR_PURPLE, secondary: COLOR_WHITE };
  }

  constructor(flag: Flag, province: Province) {
    let controllerId = flag.name.split("_", 2)[1] as Id<StructureController>;
    super(flag, province,`${province.name}_${controllerId}`);
    this.controllerId = controllerId
    this.Planner = new Planner(this);
    this.energyAcquisition = new EnergyAcquisitionBehaviour(this.province);
  }

  Planner: Planner;
  energyAcquisition : Behaviour;

  Interrupt(creep: AbstractCreep, afterFirst : AbstractCreep | undefined, nextAction: Action | undefined): Action | null {
    if(creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
    {
      return this.energyAcquisition.Interrupt(creep,afterFirst,nextAction);
    }
    return null;
  }

  PlanNext(creep: AbstractCreep): Action | null {
    if (!this.controller) {
      return null;
    }

    let creepUsed = creep.store.getUsedCapacity(RESOURCE_ENERGY);
    if (creepUsed === 0) {
      return this.energyAcquisition.PlanNext(creep);
    } else {
      return new UpgradeAction(this.controller);
    }
  }

  run(): void {
    let controller = Game.getObjectById(this.controllerId);
    if (!controller) {
      log(1, "Unable to get owned controller");
      return;
    }

    if(!this.province.Roads.Requests.find((p) => p.isEqualTo(controller!.pos)))
    {
      this.province.Roads.Requests.push(controller.pos);
    }

    let levelAmount = controller.level === 8 ? 1 : controller.level;

    if((this.province.storage?.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0) >= Math.min(300_000,(controller.progressTotal - controller.progress)) && controller.level < 8)
    {
      levelAmount *= 10;
    }

    let requestPriority = controller.ticksToDowngrade < 2500 ? this.priority*this.priority : this.priority;

    let creeps = this.province.RequestParts([WORKER], CARRY, levelAmount, this.Id, requestPriority, {deRegisterExcess: false});

    creeps = this.province.RequestCreeps(WORKER, Infinity, this.Id, 0, { deRegisterExcess: false, requestSpawn: false, stealCreeps: true });

    for (const creep of creeps) {
      this.Planner.Plan(creep);
    }
  }
}
