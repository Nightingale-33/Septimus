import { Delegation } from "../../lib/Delegation";
import { Province } from "../Province";
import { log } from "../../utils/Logging/Logger";
import { SCOUT } from "../../lib/Roles/Role.Scout";
import { Behaviour, Planner } from "../../lib/Planning/Planner";
import { Action } from "lib/Action";
import { AbstractCreep } from "lib/Planning/AbstractCreep";
import { min, remove, sortBy } from "lodash";
import { ScoutAction } from "../../lib/Actions/Creep/Action.Scout";
import { ReserveControllerMission } from "../Missions/ReserveControllerMission";
import { MoveAction } from "../../lib/Actions/Creep/Action.Move";
import { RoomIntel } from "Empire Level/RoomIntel/RoomIntelValue";

export class PrefectureAcquirer extends Delegation implements Behaviour {
  province: Province;

  name: string = "PrefectureAcquirer";

  get Id(): string {
    return `${this.province.name}_${this.name}`;
  }

  searchDepth: number = 5;

  constructor(province: Province) {
    super();
    this.province = province;
    this.scoutPlanner = new Planner(this);
  }

  scoutPlanner: Planner;

  Interrupt(creep: AbstractCreep, afterFirst: AbstractCreep | undefined, nextAction: Action | undefined): Action | null {
    return null;
  }

  PlanNext(creep: AbstractCreep): Action | null {
    if (this.scoutQueue.length === 0) {
      let followOn = GetAccessibleRooms(creep.pos.roomName).find((r) => global.empire.RoomIntel.data[r] === undefined);
      if (followOn) {
        return new ScoutAction(followOn);
      }
      return null;
    }
    let [nextRoom,distance] = min(this.scoutQueue, ([r,d]) => d);
    if (nextRoom) {
      remove(this.scoutQueue, ([r,d]) => r === nextRoom);
      return new ScoutAction(nextRoom);
    }
    throw new Error("No Next Room despite checking");
  }

  ShouldExecute(): boolean {
    return this.province.storage !== null;
  }

  scoutQueue: [string,number][] = [];

  Execute(): void {
    log(10, `Thinking about Scouting`);
    if(this.scoutQueue.length === 0)
    {
      let searchQueue = GetAccessibleRooms(this.province.Capital.RoomName).map((r): [string, number] => [r, 1]);
      let visitQueue: [string, number][] = [];
      let current = searchQueue.shift();
      while (current !== undefined) {
        visitQueue.push(current);
        let from = GetAccessibleRooms(current[0]).map((r): [string, number] => [r, current![1] + 1]);
        for (const [r, d] of from) {
          if (d <= this.searchDepth) {
            if (!searchQueue.find(([r2, d2]) => r === r2)) {
              searchQueue.push([r, d]);
            }
          }
        }
        current = searchQueue.shift();
      }
      this.scoutQueue = sortBy(visitQueue.filter(([r, d]) => !global.empire.RoomIntel.data[r]), ([r, d]) => d);
    }

    if (this.scoutQueue.length > 0) {
      log(10,`Scouting Queue: ${JSON.stringify(this.scoutQueue)}`);
      let scouts = this.province.RequestCreeps(SCOUT, GetAccessibleRooms(this.province.Capital.RoomName).length, this.Id, 1, {
        deRegisterExcess: false,
        spawnPredicate: (p) => p.Capital.room.energyAvailable >= 300
      });
      for (const scout of scouts) {
        this.scoutPlanner.Plan(scout);
      }
    }

    log(10, `Thinking about claiming`);
    //Initial Adjacent mine
    let adjacentRooms = GetAccessibleRooms(this.province.Capital.RoomName);
    for(const adjacent of adjacentRooms)
    {
      let intel = global.empire.RoomIntel.data[adjacent] as RoomIntel;
      if(!intel)
      {
        continue;
      }

      if(!intel.owner && intel.controller)
      {
        if(!Object.values(this.province.ActiveMissions).find((m) => m.pos.isEqualTo(intel.controller!) && m instanceof ReserveControllerMission))
        {
          if(Game.rooms[adjacent])
          {
            log(1,`Placing a Reserve Flag on: ${adjacent}`);
            let colours = ReserveControllerMission.GetFlagColours();
            intel.controller.createFlag(`${this.province.name}_Reserve_${adjacent}`,colours.primary,colours.secondary);
            log(1,`Placed Reservation Flag`);
          } else
          {
            log(3,`Need visibility on: ${adjacent} to place Reserve flag`);
            let visibility = this.province.RequestCreeps(SCOUT,1,this.Id+"_Visibility",1);
            for(const v of visibility)
            {
              let plan = v.memory.plan;
              if(!plan.isEmpty())
              {
                continue;
              }

              plan.append(new MoveAction(intel.controller,1));
            }
          }
        }
      }
    }
  }

}

export function GetAccessibleRooms(roomName: string): string[] {
  let capitalExits = Game.map.describeExits(roomName);
  if (!capitalExits) {
    throw new Error(`Invalid Room Name: ${roomName}`);
  }
  return [capitalExits["1"], capitalExits["3"], capitalExits["5"], capitalExits["7"]].filter((s): s is string => s !== undefined);
}
