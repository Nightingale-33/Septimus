import { isString } from "lodash";
import { GetRoomPositionFromJSON } from "../../lib/Prototypes/RoomPosition";
import { Plan } from "../../lib/Creep/Plan";

export function customJSONReviver(key : string, value: any) : any {
  if(key === "plan")
  {
    return Plan.fromJSON(value);
  }

  if(isString(value) && value.startsWith("Pos("))
  {
    return GetRoomPositionFromJSON(value);
  }
  return value;
}
