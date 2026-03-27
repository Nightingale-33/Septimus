import { ProvinceMission } from "../../lib/Mission/ProvinceMission";
import { Province } from "../Province";
import { CLAIMER } from "../../lib/Roles/Role.Claimer";
import { MoveAction } from "../../lib/Actions/Creep/Action.Move";
import { ReserveAction } from "../../lib/Actions/Creep/Action.Reserve";
import { Prefecture } from "../../Prefecture Level/Prefecture";
import { IdleAction } from "../../lib/Actions/Creep/Action.Idle";
import { LEGIONNAIRE } from "lib/Roles/Combat/Role.Legionnaire";
import { SimpleAttack } from "lib/Planning/Behaviours/Combat/SimpleAttack";
import { MeleeAction } from "lib/Actions/Creep/Combat/Action.MeleeAttack";
import { SPEARMAN } from "lib/Roles/Combat/Role.Spearman";
import { log } from "utils/Logging/Logger";

export class ReserveControllerMission extends ProvinceMission {
  priority: number = 250;

  static GetFlagColours(): { primary: ColorConstant, secondary: ColorConstant } {
    return { primary: COLOR_PURPLE, secondary: COLOR_GREY };
  }


  constructor(flag: Flag, province: Province) {
    super(flag, province, `${province.name}_Reserve_${flag.pos.roomName}`);
  }

  prefecture : Prefecture | undefined;

  run(): void {
    if(!(this.prefecture = this.province.Prefectures.find((p) => p.RoomName === this.flag.pos.roomName)))
    {
      this.province.Prefectures.push(this.prefecture = new Prefecture(this.province,this.flag.pos.roomName));
    }

    if(this.prefecture.room?.controller?.reservation?.username === "Invader")
    {
      //We need to go blow up the core

      let invaderCore = this.prefecture.structures.find((s) => s instanceof StructureInvaderCore);

      if(invaderCore)
      {
        let stabby = this.province.RequestParts([SPEARMAN], ATTACK, Math.ceil(invaderCore.hits / 10_000), this.Id, this.priority * 100, {deRegisterExcess: false, });
        let looseStabby = this.province.RequestParts([SPEARMAN,LEGIONNAIRE],ATTACK,Infinity,this.Id,this.priority,{deRegisterExcess:false,stealCreeps:true,requestSpawn:false});
        let combined = [...stabby,...looseStabby];
        log(1,`Acquired: ${stabby.length} main creeps, and ${looseStabby} additional creeps`);
        for(const c of combined)
        {
          let plan = c.memory.plan;
          if(plan.peek() instanceof IdleAction)
          {
            plan.clear(c);
          }

          if(!plan.isEmpty()) {
            continue;
          }

          if(!c.pos.isNearTo(invaderCore.pos))
          {
            plan.append(new MoveAction(invaderCore.pos,1,true));
            plan.append(new MeleeAction(invaderCore));
          }
        }
      }



      return;
    }

    if((this.prefecture?.room?.controller?.reservation?.ticksToEnd ?? 0) >= 3000)
    {
      return;
    }

    let claimer = this.province.RequestCreeps(CLAIMER, 1, this.Id, this.priority);

    for (const c of claimer) {
      let plan = c.memory.plan;
      if(plan.peek() instanceof IdleAction)
      {
        plan.clear(c);
      }

      if (!plan.isEmpty()) {
        continue;
      }

      if (!c.pos.isNearTo(this.pos)) {
        plan.append(new MoveAction(this.pos, 1));
        if(this.prefecture?.visibility)
        {
          plan.append(new ReserveAction(this.prefecture.controller!));
        }
      } else {
        plan.append(new ReserveAction(c.room.controller!));
      }
    }
  }

}
