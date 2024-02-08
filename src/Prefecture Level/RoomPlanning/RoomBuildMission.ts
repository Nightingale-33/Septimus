import { ProvinceMission } from "../../lib/Mission/ProvinceMission";
import { Province } from "../../Province Level/Province";
import { GetBuildsFromPlan } from "./ConvertPlanToBunker";
import { designDiamond } from "./BaseDesignDiamond";
import { log } from "../../utils/Logging/Logger";
import { CostMatrixAdjuster } from "../../utils/MovementUtils";
import { TRACE_FLAG } from "../../utils/Logging/FlagDecs";

export class BaseBuild extends ProvinceMission implements CostMatrixAdjuster {
  designName: string;

  buildQueue: [BuildableStructureConstant, RoomPosition][] = [];
  buildIndex: number = 0;

  get roads() : RoomPosition[] {
    return this.buildQueue.filter((s) => s[0] === STRUCTURE_ROAD).map((s) => s[1]);
  }

  constructor(flag: Flag, province: Province) {
    super(flag, province, `${province.name}_${flag.pos.roomName}_BaseBuild`);
    let flagNameComponents = flag.name.split("_", 3);
    this.designName = flagNameComponents[1];
    this.province.memory.FocalPoint = this.pos;
  }

  adjustCostMatrix(roomName: string, cm: CostMatrix): CostMatrix {
      if(this.pos.roomName === roomName)
      {
        log(10,`Adjusting Cost Matrix as Base Builder for ${roomName}`);
        for(const [buildType, pos] of this.buildQueue)
        {
          if(buildType === STRUCTURE_ROAD)
          {
            cm.set(pos.x,pos.y,1);
          } else if(buildType !== STRUCTURE_RAMPART)
          {
            cm.set(pos.x,pos.y,255);
          }
        }
        return cm;
      }
      return cm;
    }

  priority: number;

  run(): void {
    switch (this.designName) {
      case "Diamond":
        return this.buildDiamond();
    }
  }

  buildDiamond(): void {
    if (this.buildQueue.length === 0) {
      //Reset the queue
      this.buildQueue = GetBuildsFromPlan(designDiamond, this.flag.pos);
      log(1, `Build Queue: ${JSON.stringify(this.buildQueue)}`);
      return;
    }

    if (this.province.Building.ConstructionSites.filter((cs) => cs.structureType !== STRUCTURE_ROAD).length > Math.pow(this.province.Capital.controller.level, 2)) {
      return;
    }

    let next = this.buildQueue[this.buildIndex];
    this.buildIndex = (this.buildIndex + 1) % this.buildQueue.length;

    let result = next[1].createConstructionSite(next[0]);
    if (result === OK) {
      this.buildIndex = 0;
    }

  }

}
