import { Province } from "../Province Level/Province";
import { log } from "../utils/Logging/Logger";
import { Delegation } from "../lib/Delegation";
import { Profile } from "../utils/Profiler/SimpleProfile";
import { Mission } from "../lib/Mission/Mission";
import { ProvinceMissionDefs } from "../lib/Mission/ProvinceMissionDefs";
import { EmpireMissionDefs } from "../lib/Mission/EmpireMissionDefs";
import { defaultsDeep } from "lodash";
import { BuildReservation } from "../lib/Reservations/BuildReservations";
import { ResourceReservation } from "../lib/Reservations/ResourceReservations";
import { RepairReservation } from "../lib/Reservations/RepairReservations";
import { ReservationManager } from "./ReservationManager";

declare global {
  interface Memory {
    Empire: EmpireMemory;
  }

  interface EmpireMemory {
    Provinces: { [id: string]: ProvinceMemory };
  }


    namespace NodeJS {
      interface Global {
        ResetEmpire(): void;
      }
    }
}

const defaultsEmpireMemory : EmpireMemory = {
  Provinces: {}
}

const defaultsMemory : Memory = {
  BuildResv: {},
  RepairResv: {},
  RsrcResv: {},
  flags: {},
  creeps: {},
  powerCreeps: {},
  spawns: {},
  rooms: {},
  creepNum: 0,
  logLevel: 1,
  logFlags: [],
  Empire: defaultsEmpireMemory
}

export class Empire {
  Provinces: { [id: string] : Province} = {};
  Delegations: Delegation[] = [];

  ActiveMissions: {[id: string] : Mission} = {};

  Initialised: boolean = false;

  get memory(): EmpireMemory {
    return Memory.Empire;
  }

  constructor() {
    defaultsDeep(Memory,defaultsMemory);
  }

  Initialise() {
    if(this.Initialised)
    {
      return;
    }

    if (Game.cpu.tickLimit < 500) {
      log(1, "Delaying Initialisation until a full tick is possible");
    }

    if(!Memory.Empire)
    {
      Memory.Empire = {
        Provinces: {}
      };
    }

    for (const roomName in Game.rooms) {
      let room = Game.rooms[roomName];
      if (room.controller && room.controller.my) {
        let province = new Province(this,roomName);
        province.Initialise();
        this.Provinces[province.name] = province;
      }
    }

    this.Delegations.push(global.cache);
    this.Delegations.push(new ReservationManager());

    this.Initialised = true;
    log(1, "Empire Initialised");
  }

  Run() {
    if(Game.cpu.tickLimit < 500)
    {
      log(1,"Skipping tick due to low bucket");
      return;
    }

    //Check the creep plans
    Profile("Creep Plan Checks", () => {
      for (const c in Game.creeps) {
        let creep = Game.creeps[c];
        if(creep.memory === undefined)
        {
          log(1,`Creep: ${c} has no memory and is broken. Suiciding`);
          creep.suicide();
        }
        creep.checkPlan();
      }
    });

    for(const flag in Game.flags)
    {
      let f = Game.flags[flag];
      let flagNameInfo = flag.split('_',2);
      let flagScope = flagNameInfo[0];
      if(flagScope.toLowerCase() === "empire")
      {
        //Empire Missions
        if(!this.ActiveMissions[flag])
        {
          let mission = EmpireMissionDefs.getMissionFromFlag(f);
          if(mission !== null)
          {
            this.ActiveMissions[flag] = mission;
          } else
          {
            log(5,`Null Empire Mission from flag: ${flag}`);
          }
        }
      } else
      {
        //Probably a Province Mission
        if(!this.Provinces[flagScope])
        {
          log(1,`Flag: ${flag} designated for non-existent Province: ${flagScope} removing`);
          f.remove();
          continue;
        }

        if(!this.Provinces[flagScope].ActiveMissions[flag])
        {
          let mission = ProvinceMissionDefs.getProvinceMissionFromFlag(f,this.Provinces[flagScope]);
          if(mission !== null)
          {
            this.Provinces[flagScope].ActiveMissions[flag] = mission;
          } else {
            log(5,`Null Province Mission from flag: ${flag}`);
          }
        }
      }
    }

    for (const delegation of this.Delegations) {
      Profile(delegation.name, () => {
        if (delegation.ShouldExecute()) {
          delegation.Execute();
        }
      });
    }

    for (const province in this.Provinces) {
      this.Provinces[province].Run();
    }

    //Do the plan part
    Profile("Creep Plan Execution", () => {
      for (const c in Game.creeps) {
        let creep = Game.creeps[c];
        if(creep.memory === undefined)
        {
          log(1,`Creep: ${c} has no memory and is broken. Suiciding`);
          creep.suicide();
        }
        Profile(`Creep: ${c} Plan Execution`, () => {
          creep.executePlan();
        });
      }
    });
  }

  Tidy() {
    for(const provinceName in this.memory.Provinces)
    {
      if(!Game.rooms[provinceName])
      {
        log(1,`The Province of: ${provinceName} has fallen`);
        delete this.memory.Provinces[provinceName];
        delete this.Provinces[provinceName];
      } else
      {
        this.Provinces[provinceName].Tidy();
      }
    }

    for(const creepName in Memory.creeps)
    {
      if(!Game.creeps[creepName])
      {
        delete Memory.creeps[creepName];
        log(2,`Rest in Peace: ${creepName}`);
      }
    }

    for(const missionFlag in this.ActiveMissions)
    {
      if(!Game.flags[missionFlag])
      {
        log(3,`Mission Flag: ${missionFlag} is no longer active`);
        delete this.ActiveMissions[missionFlag];
      }
    }

    for(const flagName in Memory.flags)
    {
      if(!Game.flags[flagName])
      {
        log(4,`Tidying up Flag Memory for: ${flagName}`);
        delete Memory.flags[flagName];
      }
    }

    BuildReservation.Cleanup();
    ResourceReservation.Cleanup();
    RepairReservation.Cleanup();
  }
}

global.ResetEmpire = function() {
  for (const creep in Game.creeps) {
    Game.creeps[creep].suicide();
  }
  for (const flag in Game.flags) {
    Game.flags[flag].remove();
  }

  Memory.Empire = defaultsEmpireMemory;
  Memory.flags = {};
  Memory.creeps = {};
  Memory.rooms = {};
  Memory.creepNum = 0;
  Memory.BuildResv = {};
  Memory.RepairResv = {};
  Memory.RsrcResv = {};
  Memory.powerCreeps = {};
}
