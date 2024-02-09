import { Delegation } from "../../lib/Delegation";
import { CostMatrixAdjuster, MovementRoomCallback } from "../../utils/MovementUtils";
import { Province } from "../Province";
import { log } from "../../utils/Logging/Logger";

export class RoadBuilder extends Delegation implements CostMatrixAdjuster {
  adjustCostMatrix(roomName: string, cm: CostMatrix): CostMatrix {
    log(10, `Adjusting Cost Matrix for ${roomName} as RoadBuilder, Planning Mode: ${this.planning}`);
    for (const plannedRoad of this.PlannedRoads) {
      if (plannedRoad.roomName === roomName) {
        cm.set(plannedRoad.x, plannedRoad.y, 1);
      }
    }

    for(const road of this.province.structures.filter((s) => s.structureType === STRUCTURE_ROAD && s.pos.roomName === roomName))
    {
      cm.set(road.pos.x,road.pos.y,1);
    }

    if (this.planning) {
      let structures = this.province.structures.filter((s) => (OBSTACLE_OBJECT_TYPES as string[]).includes(s.structureType) || s.structureType === STRUCTURE_CONTAINER);
      for (const s of structures) {
        if (s.pos.roomName === roomName) {
          cm.set(s.pos.x, s.pos.y, 255);
        }
      }
    }

    let construction = this.province.Building.ConstructionSites.filter((cs) => cs.structureType === STRUCTURE_ROAD && cs.pos.roomName === roomName);
    for(const cs of construction)
    {
      if(this.planning)
      {
        cm.set(cs.pos.x,cs.pos.y,1);
      } else
      {
        cm.set(cs.pos.x,cs.pos.y,50);
      }
    }

    return cm;
  }

  Requests: RoomPosition[] = [];
  private HandledRequests: RoomPosition[] = [];
  PlannedRoads: RoomPosition[] = [];

  province: Province;

  name: string = "RoadBuilder";

  get Id(): string {
    return `${this.province.name}_${this.name}`;
  }

  constructor(province: Province) {
    super();
    this.province = province;
  }

  planning: boolean = false;

  ShouldExecute(): boolean {
    return this.Requests.length > this.HandledRequests.length || this.PlannedRoads.length > 0;
  }

  Execute(): void {
    if (this.province.FocalPoint) {
      if (this.Requests.length > this.HandledRequests.length) {
        let nextRequest = this.Requests.find((p) => !this.HandledRequests.find((hp) => p.isEqualTo(hp)));
        if (!nextRequest) {
          return;
        }

        let originPoint = this.province.FocalPoint;
        let goalPoint = nextRequest;

        this.planning = true;
        let path = PathFinder.search(originPoint, { pos: goalPoint, range: 1 }, { roomCallback: MovementRoomCallback, swampCost:2, plainCost:2 });
        this.planning = false;
        if (!path.incomplete) {
          for (const point of path.path) {
            this.PlannedRoads.push(point);
          }
        }
        this.HandledRequests.push(nextRequest);
      } else {
        let maximumPossible = Math.floor((Game.cpu.tickLimit - Game.cpu.getUsed()) / 2);
        let built = 0;
        while (built < maximumPossible && this.PlannedRoads.length > 0) {
          let point = this.PlannedRoads.shift();
          if (point) {
            if (point.createConstructionSite(STRUCTURE_ROAD) === OK) {
              built++;
            }
          }
        }
      }
    }
  }

}
