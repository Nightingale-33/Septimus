import { cloneDeep } from "lodash";
import { log } from "../../utils/Logging/Logger";

export class AbstractCreep {

  id: Id<Creep>;
  body: BodyPartDefinition[];
  pos: RoomPosition;
  store: StoreDefinition;

  constructor(creep: Creep | AbstractCreep) {
    this.id = creep.id;
    this.pos = new RoomPosition(creep.pos.x,creep.pos.y,creep.pos.roomName);
    this.store = cloneDeep(creep.store);
    //this.store = new SimpleStore(creep.store);
    this.body = cloneDeep(creep.body);
  }
}
