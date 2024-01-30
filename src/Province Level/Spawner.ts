import { Delegation } from "../lib/Delegation";
import { Province } from "./Province";
import { Role } from "../lib/Roles/Role";
import { max, sortBy } from "lodash";
import { SpawnHarvester } from "../lib/Roles/Role.Harvester";

declare global {
  interface ProvinceMemory {
    SpawnRequests: { id: string, role: Role, priority: number }[];
  }
}

export class Spawner extends Delegation {
  name: string = "Spawner_";
  province: Province;

  constructor(prov: Province) {
    super();
    this.province = prov;
    this.name += this.province.name;
  }

  ShouldExecute(): boolean {
    return this.province.memory.SpawnRequests.length > 0;
  }

  Execute(): void {
    let priorityOrder = this.province.memory.SpawnRequests = sortBy(this.province.memory.SpawnRequests, (request) => request.priority);

    let spawnedAnything: boolean;
    do {
      spawnedAnything = false;
      let topPrio = priorityOrder.shift();
      if (!topPrio) {
        throw new Error("Priority order was empty");
      }
      for (const spawn of this.province.spawns) {
        if(spawn.spawning)
        {
          continue;
        }
        switch (topPrio.role) {
          case "Harvester":
            spawnedAnything ||= SpawnHarvester(spawn, topPrio.priority, this.province);
            break;
        }
      }
    } while (spawnedAnything);


  }
}
