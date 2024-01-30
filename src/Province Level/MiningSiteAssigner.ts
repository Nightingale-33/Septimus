import { Delegation } from "../lib/Delegation";
import { Province } from "./Province";
import { HARVESTER } from "../lib/Roles/Role.Harvester";
import { any, filter } from "lodash";
import { MoveAction } from "../lib/Actions/Creep/Action.Move";
import { HarvestAction } from "../lib/Actions/Creep/Action.Harvest";
import { MiningMission } from "./MiningMission";

export class MiningSiteAssigner extends Delegation
{
  name: string = "MiningSiteAssigner_";

  province: Province;

  constructor(prov : Province) {
    super();
    this.province = prov;
    this.name += this.province.name;
  }


  ShouldExecute(): boolean {
      return Game.time % 25 == 0;
    }
    Execute(): void {
      let miningSites = filter(this.province.ActiveMissions,(m) : m is MiningMission => m instanceof MiningMission) as MiningMission[];
      for (const source of this.province.sources) {
        if(!miningSites.find((m) => m.source === source.id))
        {
          let flagName = `${this.province.name}_${source.id}`;
          source.pos.createFlag(flagName,COLOR_GREY,COLOR_YELLOW);
        }
      }
    }

}
