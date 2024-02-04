import { ProvinceMission, ProvinceMissionMemory } from "../../lib/Mission/ProvinceMission";
import { Province } from "../Province";
import { defaultsDeep, min } from "lodash";
import { WORKER } from "../../lib/Roles/Role.Worker";
import { log } from "../../utils/Logging/Logger";
import { MoveAction } from "../../lib/Actions/Creep/Action.Move";
import { UpgradeAction } from "../../lib/Actions/Creep/Action.Upgrade";
import { ResourceReservation } from "../../lib/Reservations/ResourceReservations";
import { WithdrawAction } from "../../lib/Actions/Creep/Action.Withdraw";
import { PickupAction } from "../../lib/Actions/Creep/Action.Pickup";
import { IdleAction } from "../../lib/Actions/Creep/Action.Idle";

interface OwnedControllerMemory extends ProvinceMissionMemory {
}

const defaultOwnedControllerMemory : OwnedControllerMemory = {
  Id: "",
};

export class OwnedControllerMission extends ProvinceMission {
  memory: OwnedControllerMemory;

  priority:number = 1;

  controllerId : Id<StructureController>;

  static GetFlagColours() : {primary: ColorConstant, secondary: ColorConstant}
  {
    return {primary:COLOR_PURPLE,secondary:COLOR_WHITE};
  }

  constructor(flag:Flag, province: Province) {
    super(flag,province);
    defaultsDeep(this.memory,defaultOwnedControllerMemory);
    this.controllerId = flag.name.split('_',2)[1] as Id<StructureController>;
  }

  run(): void {
    let controller = Game.getObjectById(this.controllerId);
    if(!controller)
    {
      log(1,"Unable to get owned controller");
      return;
    }

    let creeps = this.province.RequestCreeps(WORKER,1,this.memory.Id,this.priority,false,true);

    let requestAmount = controller.level;
    let requestPriority = controller.ticksToDowngrade < 2500 ? 50 : this.priority;

    creeps = this.province.RequestCreeps(WORKER, requestAmount,this.memory.Id,requestPriority,false,false);

    for(const creep of creeps)
    {
      //Behaviour logic
      let plan = creep.memory.plan;
      if(plan.peek() instanceof IdleAction)
      {
        plan.clear(creep);
      }
      if(!plan.isEmpty())
      {
        continue;
      }

      let creepUsed = creep.store.getUsedCapacity(RESOURCE_ENERGY);
      let creepFree = creep.store.getFreeCapacity(RESOURCE_ENERGY);
      if(creepUsed < creepFree)
      {
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
      } else
      {
        //Use the energy
        if(!creep.pos.inRangeTo(this.pos,3))
        {
          let move = new MoveAction(this.pos,3);
          plan.append(move);
        }

        let upgrade = new UpgradeAction(controller);
        plan.append(upgrade);
      }

      if(plan.isEmpty())
      {
        plan.append(new IdleAction());
      }
    }
  }
}
