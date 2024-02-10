import { Delegation } from "../lib/Delegation";
import { Province } from "../Province Level/Province";
import { Prefecture } from "./Prefecture";
import { DefendPrefectureMission } from "../Province Level/Missions/DefendPrefectureMission";
import { log } from "../utils/Logging/Logger";

export class PrefectureDefense extends Delegation
{
    province: Province;
    prefecture : Prefecture
    name: string = "PrefectureDefense";
    get Id(): string {return `${this.province.name}_${this.name}`;}

  constructor(prefecture : Prefecture) {
    super();
    this.province = prefecture.province;
    this.prefecture = prefecture;
  }
  ShouldExecute(): boolean {
        return this.prefecture.visibility && this.prefecture.room.find(FIND_HOSTILE_CREEPS).length > 0;
    }
    Execute(): void {
        let enemyCreeps = this.prefecture.room.find(FIND_HOSTILE_CREEPS);
        let colours = DefendPrefectureMission.GetFlagColours();
        let id = `${this.province.name}_Defend_${this.prefecture.RoomName}`;
        if(!this.province.ActiveMissions[id])
        {
          log(1,`UNDER ATTACK at: ${this.prefecture.RoomName}`);
          enemyCreeps[0].pos.createFlag(id,colours.primary,colours.secondary);
        }
    }

}
