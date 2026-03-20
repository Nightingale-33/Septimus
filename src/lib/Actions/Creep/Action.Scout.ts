import { Action } from "../../Action";
import { MovementRoomCallback } from "../../../utils/MovementUtils";
import { log } from "../../../utils/Logging/Logger";
import { moveTo } from "screeps-cartographer";
import { AbstractCreep } from "../../Planning/AbstractCreep";
import { CountParts } from "../../../utils/CreepUtils";
import { RoomIntel } from "../../../Empire Level/RoomIntel/RoomIntelValue";
import { TRACE_FLAG } from "utils/Logging/FlagDecs";

export const SCOUT_ID: string = "S";

export class ScoutAction extends Action {
  Chat: string = "⛵";
  Name: string = "Scout";

  Target: string;
  pos: RoomPosition;

  constructor(target: string) {
    super();
    if(!Game.map.describeExits(target))
    {
      throw new Error(`Invalid roomname supplied; ${target}`);
    }

    this.Target = target;
    log(TRACE_FLAG,`Scout Room Pos Args: (${25},${25},${this.Target})`);
    this.pos = new RoomPosition(25,25,this.Target);
  }

  toJSON(): string {
    return SCOUT_ID + ":" + this.Target;
  }

  static fromJSON(data: string) {
    let components = data.split(",", 1);
    return new ScoutAction(components[0]);
  }

  isValid(creep: Creep): boolean {
    return CountParts(creep)[MOVE] > 0 && (global.empire.RoomIntel.data[this.pos.roomName] === undefined);
  }

  run(creep: Creep): boolean {
    creep.notifyWhenAttacked(false);
    let avoidCreeps = false;
    let result = moveTo(creep, {pos:this.pos,range:30}, {
      priority: 1,
      visualizePathStyle: {},
      avoidCreeps: avoidCreeps,

      swampCost: 5, plainCost:2
    }, { visualizePathStyle: { stroke: "#FF0000" }, avoidCreeps: true });

    if(!global.empire.RoomIntel.data[creep.room.name])
    {
      let intel = new RoomIntel();
      log(1,`Recording Intel for: ${creep.room.name}`);
      this.fillIntel(intel,creep);
      global.empire.RoomIntel.data[creep.room.name] = intel;
    }

    return result == OK || result == ERR_TIRED;
  }

  fillIntel(intel: RoomIntel, creep: Creep)
  {
    let sources = creep.room.find(FIND_SOURCES);
    intel.sources = sources.map((s) => s.pos);

    if(creep.room.controller)
    {
      intel.controller = creep.room.controller.pos;
      intel.owner = creep.room.controller.owner?.username ?? "";
    }

    let minerals = creep.room.find(FIND_MINERALS);
    intel.minerals = minerals.map((m) => m.pos);
    intel.mineralTypes = minerals.map((m) => m.mineralType);
  }

  ApproxTimeLeft(creep: AbstractCreep): number {
    return creep.pos.getMultiRoomRangeTo(this.pos);
  }

  apply(ac: AbstractCreep) {
    ac.pos = this.pos;
  }
}
