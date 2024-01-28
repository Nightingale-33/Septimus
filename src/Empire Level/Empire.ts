import { Province } from "../Province Level/Province";
import { log } from "../utils/Logging/Logger";
import { Delegation } from "../lib/Delegation";

export class Empire {
  Provinces: Province[] = [];
  Delegations: Delegation[] = [];

  Initialised: boolean = false;

  constructor() {
  }

  Initialise() {
    if(Game.cpu.tickLimit < 500)
    {
      log(1,"Delaying Initialisation until a full tick is possible");
    }

    for(const roomName in Game.rooms)
    {
      let room = Game.rooms[roomName];
      if(room.controller && room.controller.my)
      {
        //Todo, acknowledge attached. Likely memory of the Province
        let province = new Province(roomName,[]);
        province.Initialise();
        this.Provinces.push(province);
      }
    }

    this.Initialised = true;
    log(1,"Empire Initialised");
  }

  Run() {

    for(const delegation of this.Delegations)
    {
      if(delegation.ShouldExecute())
      {
        delegation.Execute();
      }
    }

    for(const province of this.Provinces)
    {
      province.Run();
    }

    //Do the plan part
    for(const c in Game.creeps)
    {
      let creep = Game.creeps[c];
      creep.executePlan();
    }
  }
}
