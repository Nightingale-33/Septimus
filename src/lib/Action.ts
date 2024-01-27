import { IDLE_ID, IdleAction } from "./Actions/Creep/Action.Idle";
import { MOVE_ID, MoveAction } from "./Actions/Creep/Action.Move";
import { HARVEST_ID, HarvestAction } from "./Actions/Creep/Action.Harvest";
import { UPGRADE_ID, UpgradeAction } from "./Actions/Creep/Action.Upgrade";
import { FILL_ID, FillAction } from "./Actions/Creep/Action.Fill";
import { BUILD_ID, BuildAction } from "./Actions/Creep/Action.Build";
import { REPAIR_ID, RepairAction } from "./Actions/Creep/Action.Repair";
import { PICKUP_ID, PickupAction } from "./Actions/Creep/Action.Pickup";
import { WITHDRAW_ID, WithdrawAction } from "./Actions/Creep/Action.Withdraw";
import { DISMANTLE_ID, DismantleAction } from "./Actions/Creep/Action.Dismantle";
import { RECYCLE_ID, RecycleAction } from "./Actions/Creep/Action.Recycle";
import { log } from "../utils/Logging/Logger";

export abstract class Action {


  cleanup(creep: Creep):void;


  static fromJSON(data: string): Action | null
  {
    let components = data.split(":", 2);
    let id = components[0];
    let actionData = components[1];
    switch (id) {
      case IDLE_ID: {
        return IdleAction.fromJSON(actionData);
      }

      case MOVE_ID: {
        return MoveAction.fromJSON(actionData);
      }

      case HARVEST_ID: {
        return HarvestAction.fromJSON(actionData);
      }

      case UPGRADE_ID: {
        return UpgradeAction.fromJSON(actionData);
      }

      case FILL_ID: {
        return FillAction.fromJSON(actionData);
      }

      case BUILD_ID: {
        return BuildAction.fromJSON(actionData);
      }

      case REPAIR_ID: {
        return RepairAction.fromJSON(actionData);
      }

      case PICKUP_ID: {
        return PickupAction.fromJSON(actionData);
      }

      case WITHDRAW_ID: {
        return WithdrawAction.fromJSON(actionData);
      }

      case DISMANTLE_ID: {
        return DismantleAction.fromJSON(actionData);
      }

      case RECYCLE_ID: {
        return RecycleAction.fromJSON(actionData);
      }

      default: {
        log(1,`Received unexpected ID: ${id} interpreting as Idle`);
        return IdleAction.fromJSON(actionData);
      }
    }
  }
}
