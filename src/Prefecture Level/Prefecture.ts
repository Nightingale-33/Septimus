import { log } from "../utils/Logging/Logger";
import { Delegation } from "../lib/Delegation";
import { Profile } from "../utils/Profiler/SimpleProfile";
import { Province } from "../Province Level/Province";

declare global {
  interface RoomMemory
  {

  }
}

export class Prefecture {
  Initialised: boolean = false;

  province: Province;

  Delegations: Delegation[] = [];

  RoomName: string;
  get room() : Room {return Game.rooms[this.RoomName];}

  get sources() : Source[] { return this.room.find(FIND_SOURCES); }

  constructor(province: Province, roomName: string) {
    this.province = province;
    this.RoomName = roomName;
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
  }
}
