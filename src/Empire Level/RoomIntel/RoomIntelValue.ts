import { GetRoomPositionFromJSON } from "../../lib/Prototypes/RoomPosition.js";
import { log } from "../../utils/Logging/Logger.js";

export class RoomIntel {
  sources: RoomPosition[] = [];
  controller: RoomPosition | undefined = undefined;
  mineralTypes: MineralConstant[] = [];
  minerals: RoomPosition[] = [];
  owner:string = "";
  toJSON(): string
  {
    return `${this.owner}¦${this.sources.map((s) => s.toJSON()).join('/')}¦${this.controller?.toJSON()}¦${this.mineralTypes?.join('/')}¦${this.minerals.map((m) => m.toJSON()).join('/')}`;
  }

  static fromJSON(data : string) : RoomIntel
  {
    let components = data.split('¦',5);
    log(1,`Components: ${JSON.stringify(components)}`);
    let intelObject = new RoomIntel();
    intelObject.owner = components[0];
    if(components[1].length > 0)
    {
      intelObject.sources = components[1].split('/').map(GetRoomPositionFromJSON);
    }
    if(components[2].length > 0 && components[2] !== "undefined")
    {
      intelObject.controller = GetRoomPositionFromJSON(components[2]);
    }
    intelObject.mineralTypes = components[3].split('/') as MineralConstant[];
    if(components[4].length > 0)
    {
      intelObject.minerals = components[4].split('/').map(GetRoomPositionFromJSON);
    }
    return intelObject;
  }
}
