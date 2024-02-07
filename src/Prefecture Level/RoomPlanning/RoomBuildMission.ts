import { ProvinceMission } from "../../lib/Mission/ProvinceMission";
import { Province } from "../../Province Level/Province";
import { GetBuildsFromPlan } from "./ConvertPlanToBunker";
import { designDiamond } from "./BaseDesignDiamond";
import { log } from "../../utils/Logging/Logger";

export class BaseBuild extends ProvinceMission
{
    designName: string;

    buildQueue: [BuildableStructureConstant,RoomPosition][] = [];

    constructor(flag : Flag, province : Province) {
      super(flag,province,`${province.name}_${flag.pos.roomName}_BaseBuild`);
      let flagNameComponents = flag.name.split('_',3);
      this.designName = flagNameComponents[1];
      this.province.memory.FocalPoint = this.pos;
    }

    priority: number;
    run(): void {
      switch (this.designName)
      {
        case "Diamond": return this.buildDiamond();
      }
    }

    buildDiamond() : void {
      if(this.buildQueue.length === 0)
      {
        //Reset the queue
        this.buildQueue = GetBuildsFromPlan(designDiamond,this.flag.pos);
        log(1,`Build Queue: ${JSON.stringify(this.buildQueue)}`);
      }

      if(this.province.Building.ConstructionSites.length > Math.pow(this.province.Capital.controller.level,2))
      {
        return;
      }

      let next = this.buildQueue.shift();
      if(next)
      {
        let result = next[1].createConstructionSite(next[0]);
        if(result === OK)
        {
          this.buildQueue = [];
        }
      }
    }

}
