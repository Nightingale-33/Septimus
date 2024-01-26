import { Prefecture } from "../Prefecture Level/Prefecture";
import { log } from "../utils/Logging/Logger";
import { flatten } from "lodash";

export class Province {
  Prefectures: Prefecture[];
  Capital: Prefecture;

  Initialised : boolean = false;

  get sources() : Source[] {
    return flatten(this.Prefectures.map((p) => p.sources));
  }

  constructor(provinceCapitalRoomName: string, attachedPrefectures: string[]) {
    this.Capital = new Prefecture(provinceCapitalRoomName);
    this.Prefectures = [this.Capital];
    for(const attachedName in attachedPrefectures) {
      this.Prefectures.push(new Prefecture(attachedName));
    }
  }

  Initialise()
  {
    for(const prefecture of this.Prefectures)
    {
      prefecture.Initialise();
    }

    this.Initialised = true;
    log(1,`Province at: ${this.Capital.RoomName} Initialised`);
  }
}
