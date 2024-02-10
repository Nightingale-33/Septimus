import { Action } from "lib/Action";
import { AbstractCreep } from "lib/Planning/AbstractCreep";
import { Behaviour } from "../../Planner";
import { MeleeAction } from "../../../Actions/Creep/Combat/Action.MeleeAttack";
import { Prefecture } from "../../../../Prefecture Level/Prefecture";

export class SimpleAttack implements Behaviour {
  prefecture : Prefecture

  constructor(prefecture: Prefecture) {
    this.prefecture = prefecture;
  }

  Interrupt(creep: AbstractCreep, afterFirst: AbstractCreep | undefined, nextAction: Action | undefined): Action | null {
    let nearbyEnemies = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 1);
    if (nearbyEnemies.length > 0 && !(nextAction instanceof MeleeAction)) {
      return new MeleeAction(nearbyEnemies[0]);
    }
    return null;
  }

  PlanNext(creep: AbstractCreep): Action | null {
    let nearestEnemy = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
    if(nearestEnemy)
    {
      return new MeleeAction(nearestEnemy);
    }
    return null;
  }

}
