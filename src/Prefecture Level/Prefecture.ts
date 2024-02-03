import { log } from "../utils/Logging/Logger";
import { Delegation } from "../lib/Delegation";
import { Profile } from "../utils/Profiler/SimpleProfile";
import { Province } from "../Province Level/Province";
import { OwnedControllerMission } from "../Province Level/Missions/OwnedControllerMission";
import { DistanceTransform, DTDisplayRooms } from "./RoomPlanning/DistanceTransform";

declare global {
  interface RoomMemory
  {

  }
}

export class Prefecture {
  Initialised: boolean = false;

  province: Province;

  Delegations: Delegation[] = [];

  distanceTransformer : DistanceTransform;

  RoomName: string;
  get room() : Room {return Game.rooms[this.RoomName];}

  get sources() : Source[] { return this.room.find(FIND_SOURCES); }

  constructor(province: Province, roomName: string) {
    this.province = province;
    this.RoomName = roomName;
    this.distanceTransformer = new DistanceTransform();
  }

  Initialise()
  {
    this.Initialised = true;
    log(2,`Prefecture at: ${this.RoomName} initialised`);
  }

  Run()
  {
    for(const delegation of this.Delegations)
    {
      Profile(delegation.name,() => {
        if(delegation.ShouldExecute())
        {
          delegation.Execute();
        }
      });
    }

    if(this.room.controller?.my)
    {
      let flagName = this.RoomName + "_" + this.room.controller.id;
      if(!Game.flags[flagName])
      {
        let colour = OwnedControllerMission.GetFlagColours();
        this.room.controller.pos.createFlag(flagName,colour.primary,colour.secondary);
      }
    }

    if(Game.cpu.tickLimit > 250)
    {
      if(!this.distanceTransformer.data)
      {
        Profile(`${this.RoomName} Distance Transform`, () => {
          this.distanceTransformer.calculate(this.room.getTerrain());
        });
      }

      if(DTDisplayRooms[this.RoomName])
      {
        this.distanceTransformer.display(this.room.visual);
      }
    }
  }
}
