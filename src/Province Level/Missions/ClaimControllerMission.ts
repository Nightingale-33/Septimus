import { ProvinceMission } from "../../lib/Mission/ProvinceMission";
import { Province } from "../Province";

export class ClaimControllerMission extends ProvinceMission
{
    priority: number = 1;

  static GetFlagColours(): { primary: ColorConstant, secondary: ColorConstant } {
    return { primary: COLOR_PURPLE, secondary: COLOR_PURPLE };
  }

  constructor(flag : Flag,province : Province) {
    super(flag,province,`${province.name}_Claim_${flag.pos.roomName}`);
  }

    run(): void {
        throw new Error("Method not implemented.");
    }

}
