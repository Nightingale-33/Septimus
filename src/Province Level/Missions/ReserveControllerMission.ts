import { ProvinceMission } from "../../lib/Mission/ProvinceMission";
import { Province } from "../Province";
import { CLAIMER } from "../../lib/Roles/Role.Claimer";
import { MoveAction } from "../../lib/Actions/Creep/Action.Move";
import { ReserveAction } from "../../lib/Actions/Creep/Action.Reserve";
import { Prefecture } from "../../Prefecture Level/Prefecture";

export class ReserveControllerMission extends ProvinceMission {
  priority: number = 250;

  static GetFlagColours(): { primary: ColorConstant, secondary: ColorConstant } {
    return { primary: COLOR_PURPLE, secondary: COLOR_GREY };
  }


  constructor(flag: Flag, province: Province) {
    super(flag, province, `${province.name}_Reserve_${flag.pos.roomName}`);
  }

  run(): void {
    if(!this.province.Prefectures.find((p) => p.RoomName === this.flag.pos.roomName))
    {
      this.province.Prefectures.push(new Prefecture(this.province,this.flag.pos.roomName));
    }

    let claimer = this.province.RequestCreeps(CLAIMER, 1, this.Id, this.priority);

    for (const c of claimer) {
      let plan = c.memory.plan;
      if (!plan.isEmpty()) {
        continue;
      }

      if (!c.pos.isNearTo(this.pos)) {
        plan.append(new MoveAction(this.pos, 1));
      } else {
        plan.append(new ReserveAction(c.room.controller!));
      }
    }
  }

}
