//Missions are interpretations of flags and may spawn Delegations
import { Empire } from "../../Empire Level/Empire";
import { GetRandomId } from "../../utils/StringUtils";

export interface MissionMemory extends FlagMemory {
  Id: string;
}

export abstract class Mission {
  memory: MissionMemory;
  pos: RoomPosition;
  empire: Empire;
  flag: Flag;

  get Id(): string {return this.memory.Id;};

  protected constructor(flag : Flag, Id : string) {
    this.flag = flag;
    this.pos = flag.pos;
    //Done to acquire the flag memory object
    //@ts-ignore
    this.memory = flag.memory;
    if(!this.memory.Id)
    {
      this.memory.Id = Id;
    }
    this.empire = global.empire!;
  }

  abstract run() : void;
}
