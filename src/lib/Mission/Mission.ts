//Missions are interpretations of flags and may spawn Delegations
import { Empire } from "../../Empire Level/Empire";
import { GetRandomId } from "../../utils/StringUtils";

export interface MissionMemory extends FlagMemory {
  Id: string;
}

export abstract class Mission {
  pos: RoomPosition;
  empire: Empire;
  flag: Flag;

  get Id(): string {return this.flag.name;};

  protected constructor(flag : Flag, Id : string) {
    this.flag = flag;
    this.pos = flag.pos;
    this.empire = global.empire!;
  }

  abstract run() : void;
}
