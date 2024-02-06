import { cloneDeep } from "lodash";
import { log } from "../../utils/Logging/Logger";
import { SimpleStore } from "./SimpleStore";

export class AbstractCreep {

  id: Id<Creep>;
  body: BodyPartDefinition[];
  pos: RoomPosition;
  store: SimpleStore;
  get room() : Room | null { return Game.rooms[this.pos.roomName] ?? null;}

  constructor(creep: Creep | AbstractCreep) {
    this.id = creep.id;
    this.pos = new RoomPosition(creep.pos.x, creep.pos.y, creep.pos.roomName);
    this.store = new SimpleStore(creep.store);
    this.body = cloneDeep(creep.body);
  }
}
