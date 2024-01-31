//Missions are interpretations of flags and may spawn Delegations
import { Empire } from "../../Empire Level/Empire";
import { GetRandomId } from "../../utils/StringUtils";

declare global {
  interface CreepMemory {
    missionId: string | undefined;
  }
}

export interface MissionMemory extends FlagMemory {
  Id: string;
}

export abstract class Mission {
  memory: MissionMemory;
  pos: RoomPosition;
  empire: Empire;
  flag: Flag;

  protected constructor(flag : Flag) {
    this.flag = flag;
    this.pos = flag.pos;
    //Done to acquire the flag memory object
    //@ts-ignore
    this.memory = flag.memory;
    if(!this.memory.Id)
    {
      this.memory.Id = GetRandomId();
    }
    this.empire = global.empire!;
  }

  abstract run() : void;
}
