import { Delegation } from "../../lib/Delegation";
import { Province } from "../Province";
import { filter, find, forEach } from "lodash";
import { MiningMission } from "../Missions/MiningMission";
import { log } from "utils/Logging/Logger";
import { MineralMiningMission } from "Province Level/Missions/MineralMiningMission";

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
      return this.province.MiningSites.length < this.province.sources.length || ((this.province.Capital.controller?.level ?? 0) >= 6 && !find(this.province.ActiveMissions,(m) : m is MineralMiningMission => m instanceof MineralMiningMission));
    }
    Execute(): void {
      let miningSites = filter(this.province.ActiveMissions,(m) : m is MiningMission => m instanceof MiningMission) as MiningMission[];
      for (const source of this.province.sources) {
        if(!miningSites.find((m) => m.sourceId === source.id))
        {
          if((source.room.controller?.reservation?.username === undefined || source.room.controller.reservation.username === this.province.Capital.controller?.owner?.username || source.room.controller.reservation.username === "Invader"))
          {
            log(1,`Creating a mining mission in the room ${source.room.name} as it is reserved by: ${source.room.controller?.reservation?.username}`);
            let flagName = `${this.province.name}_${source.id}`;
            let colour = MiningMission.GetFlagColours();
            source.pos.createFlag(flagName,colour.primary,colour.secondary);
          }
        }
      }

      if((this.province.Capital.controller?.level ?? 0) >= 6)
      {
        let mineralMining = find(this.province.ActiveMissions,(m) : m is MineralMiningMission => m instanceof MineralMiningMission);
        if(!mineralMining)
        {
            let room = this.province.Capital.room;
            let minerals = room.find(FIND_MINERALS);
            for(const mineral of minerals)
            {
                log(1,`Creating a mineral mining mission in the room ${mineral.room?.name}`);
                let flagName = `${this.province.name}_${mineral.id}`;
                let colour = MineralMiningMission.GetFlagColours();
                mineral.pos.createFlag(flagName,colour.primary,colour.secondary);
            }
        }
      }
    }

}
