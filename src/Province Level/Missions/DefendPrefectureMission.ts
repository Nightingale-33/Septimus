import { ProvinceMission } from "../../lib/Mission/ProvinceMission";
import { Province } from "../Province";
import { Prefecture } from "../../Prefecture Level/Prefecture";
import { LEGIONNAIRE } from "../../lib/Roles/Combat/Role.Legionnaire";
import { MoveAction } from "../../lib/Actions/Creep/Action.Move";
import { sum } from "lodash";
import { CountParts } from "../../utils/CreepUtils";
import { Behaviour, Planner } from "../../lib/Planning/Planner";
import { SimpleAttack } from "../../lib/Planning/Behaviours/Combat/SimpleAttack";
import { log } from "../../utils/Logging/Logger";

export class DefendPrefectureMission extends ProvinceMission
{
  priority: number = 750000;

  static GetFlagColours(): { primary: ColorConstant, secondary: ColorConstant } {
    return { primary: COLOR_RED, secondary: COLOR_GREY };
  }

  prefecture: Prefecture;
  combatBehaviour : Behaviour;

  combatPlanner: Planner;

  constructor(flag: Flag, province: Province) {
    super(flag, province, `${province.name}_Defend_${flag.pos.roomName}`);
    let prefecture = this.province.Prefectures.find((p) => p.RoomName === flag.pos.roomName);
    if(!prefecture)
    {
      log(1,`Unable to find Prefecture: ${flag.pos.roomName}`);
      flag.remove();
      return;
    }

    this.prefecture = prefecture;
    this.combatBehaviour = new SimpleAttack(this.prefecture);
    this.combatPlanner = new Planner(this.combatBehaviour,3);
  }
    run(): void {
        if(!this.prefecture?.visibility)
        {
          //Get visibility
          let check = this.province.RequestCreeps(LEGIONNAIRE,1,this.Id,this.priority, {deRegisterExcess: false, stealCreeps: true});
          for(const c of check)
          {
            let plan = c.memory.plan;
            if(!plan.isEmpty())
            {
              return;
            }

            plan.append(new MoveAction(this.pos,15,true));
          }

          return;
        }

        let enemies = this.prefecture.room.find(FIND_HOSTILE_CREEPS);

        if(enemies.length === 0)
        {
          this.flag.remove();
          return;
        }

        let enemyAttack = sum(enemies,(hc) => CountParts(hc)[ATTACK]);
        let defensePredicate = (province : Province) : boolean => province.Capital.room.energyAvailable >= province.Capital.room.energyCapacityAvailable * 0.5;
        let force = this.province.RequestParts([LEGIONNAIRE], ATTACK, enemyAttack*2,this.Id,enemyAttack*this.priority, {deRegisterExcess:false, spawnPredicate: defensePredicate, clearPlan: true});

        for(const f of force)
        {
          let plan = f.memory.plan;
          if(f.pos.roomName !== this.pos.roomName)
          {
            if(!plan.isEmpty())
            {
              continue;
            }

            plan.append(new MoveAction(this.pos,15,true));
          } else
          {
            this.combatPlanner.Plan(f);
          }
        }
    }

}
