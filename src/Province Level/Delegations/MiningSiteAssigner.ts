import { Delegation } from "../../lib/Delegation";
import { Province } from "../Province";
import { filter } from "lodash";
import { MiningMission } from "../Missions/MiningMission";

export class MiningSiteAssigner extends Delegation
{
  name: string = "MiningSiteAssigner_";

  get Id() : string {return this.province.name + "_MiningSiteAssigner"};

  province: Province;

  constructor(prov : Province) {
    super();
    this.province = prov;
    this.name += this.province.name;
  }


  ShouldExecute(): boolean {
      return this.province.MiningSites.length < this.province.sources.length;
    }
    Execute(): void {
      let miningSites = filter(this.province.ActiveMissions,(m) : m is MiningMission => m instanceof MiningMission) as MiningMission[];
      for (const source of this.province.sources) {
        if(!miningSites.find((m) => m.sourceId === source.id) && (source.room.controller?.reservation?.username !== undefined && source.room.controller.reservation.username !== this.province.Capital.controller?.owner?.username) )
        {
          let flagName = `${this.province.name}_${source.id}`;
          let colour = MiningMission.GetFlagColours();
          source.pos.createFlag(flagName,colour.primary,colour.secondary);
        }
      }
    }

}
