import { log } from "../utils/Logging/Logger";
import { Delegation } from "../lib/Delegation";

export class Prefecture {
  Initialised: boolean = false;

  Delegations: Delegation[] = [];

  RoomName: string;
  get room() : Room {return Game.rooms[this.RoomName];}

  get sources() : Source[] { return this.room.find(FIND_SOURCES); }

  constructor(roomName: string) {
    if(Game.rooms[roomName])
    {
      this.RoomName = roomName;
    }
    throw new Error("Invalid Room attempted to be marked as a Prefecture");
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
      if(delegation.ShouldExecute())
      {
        delegation.Execute();
      }
    }
  }
}
