import { log } from "../utils/Logging/Logger";
import { Delegation } from "../lib/Delegation";
import { Profile } from "../utils/Profiler/SimpleProfile";
import { Province } from "../Province Level/Province";
import { OwnedControllerMission } from "../Province Level/Missions/OwnedControllerMission";
import { DistanceTransform, DTDisplayRooms } from "./RoomPlanning/DistanceTransform";
import { TowerDelegation } from "./TowerDelegation";
import { PrefectureDefense } from "./PrefectureDefense";

declare global {
  interface RoomMemory {

  }
}

export class Prefecture {
  Initialised: boolean = false;

  get memory(): RoomMemory {
    return this.room.memory;
  }

  province: Province;

  Defense : PrefectureDefense;

  get Delegations() : Delegation[] { return this.GeneralDelegations.concat([this.Defense]);}
  GeneralDelegations: Delegation[] = [];

  distanceTransformer: DistanceTransform;

  RoomName: string;

  get room(): Room {
    return Game.rooms[this.RoomName];
  }

  get visibility(): boolean {
    return this.room !== undefined;
  }

  get towers(): StructureTower[] {
    return global.cache.UseValue(() => this.room?.find(FIND_MY_STRUCTURES).filter((s): s is StructureTower => s instanceof StructureTower) ?? [], 0, `${this.RoomName}_Towers`);
  }

  get controller(): StructureController | undefined {
    if(!this.visibility)
    {
      return undefined;
    }
    if (!this.room.controller) {
      throw new Error("Room without controller marked as Prefecture");
    } else {
      return this.room.controller;
    }
  }

  get sources(): Source[] {
    return this.room?.find(FIND_SOURCES) ?? [];
  }

  get constructionSites() : ConstructionSite[] {
    return this.room?.find(FIND_MY_CONSTRUCTION_SITES) ?? [];
  }

  get structures() : Structure[] {
    return this.room?.find(FIND_STRUCTURES) ?? [];
  }

  constructor(province: Province, roomName: string) {
    this.province = province;
    this.RoomName = roomName;
    this.distanceTransformer = new DistanceTransform();
  }

  Initialise() {
    this.Initialised = true;

    this.Defense = new PrefectureDefense(this);
    this.GeneralDelegations.push(new TowerDelegation(this));

    log(2, `Prefecture at: ${this.RoomName} initialised`);
  }

  Run() {
    for (const delegation of this.Delegations) {
      Profile(`Delegation: ${delegation.name}`, () => {
        if (delegation.ShouldExecute()) {
          delegation.Execute();
        }
      });
    }

    if (this.room?.controller?.my) {
      let flagName = this.RoomName + "_" + this.room.controller.id;
      if (!Game.flags[flagName]) {
        let colour = OwnedControllerMission.GetFlagColours();
        this.room.controller.pos.createFlag(flagName, colour.primary, colour.secondary);
      }
    }

    if (!this.distanceTransformer.data && (Game.cpu.tickLimit - Game.cpu.getUsed()) > 250) {
      Profile(`${this.RoomName} Distance Transform`, () => {
        this.distanceTransformer.calculate(Game.map.getRoomTerrain(this.RoomName));
      });
    }

    if (DTDisplayRooms[this.RoomName]) {
      this.distanceTransformer.display(this.room.visual);
    }
  }
}
