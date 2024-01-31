import { Delegation } from "../lib/Delegation";
import { Province } from "./Province";
import { filter } from "lodash";
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
          let colour = MiningMission.GetFlagColours();
          source.pos.createFlag(flagName,colour.primary,colour.secondary);
        }
      }
    }

}
