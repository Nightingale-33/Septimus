import { Delegation } from "../../lib/Delegation";
import { RoomIntel } from "./RoomIntelValue";
import { log } from "../../utils/Logging/Logger";

declare global {
  interface EmpireMemory
  {
    roomDatabase: string;
  }
}

export class RoomIntelligence extends Delegation
{
    data: {[id:string] : RoomIntel} = {};

    name: string;
    Id: string;
    ShouldExecute(): boolean {
        return Object.keys(this.data).length === 0 || Object.keys(this.data).length > this.lastParsedEntries;
    }

    lastParsedEntries = 0;

    Execute(): void {
      let knownEntries = Object.keys(this.data).length;
      if(knownEntries === 0)
      {
        this.ParseDatabase();
      } else if(knownEntries > this.lastParsedEntries)
      {
        this.WriteDatabase();
        this.lastParsedEntries = knownEntries;
      }
    }

    ParseDatabase() {
      let data = global.empire.memory.roomDatabase;
      if(!data)
      {
        return;
      }
      let entries = data.split(',');
      for(const entry of entries)
      {
        log(1,`Entry: ${entry}`);
        let sections = entry.split(':',2);
        this.data[sections[0]] = RoomIntel.fromJSON(sections[1]);
      }
    }

    WriteDatabase() {
      let databaseKnowledge = Object.entries(this.data).map(([name,intel]) => `${name}:${intel.toJSON()}`).join(',');
      log(10,`RoomIntel Database: ${databaseKnowledge}`);
      global.empire.memory.roomDatabase = databaseKnowledge;
    }
}
