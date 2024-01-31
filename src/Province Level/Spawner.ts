import { Delegation } from "../lib/Delegation";
import { Province } from "./Province";
import { Role } from "../lib/Roles/Role";
import { max, remove } from "lodash";
import { HARVESTER, SpawnHarvester } from "../lib/Roles/Role.Harvester";
import { SpawnWorker, WORKER } from "../lib/Roles/Role.Worker";

declare global {
  interface ProvinceMemory {
    SpawnRequests: { id: string, role: Role, priority: number ,inProgress: string | undefined }[];
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
    if(this.province.memory.SpawnRequests.length === 0)
    {
      throw new Error("Spawner was executed with no requests");
    }

    remove(this.province.memory.SpawnRequests, (r) => r.inProgress && Game.creeps[r.inProgress]);

    let availableSpawns = this.province.spawns.filter((s) => !s.spawning);

    let spawnedAnything: boolean;
    do {
      let available = this.province.memory.SpawnRequests.filter((r) => !r.inProgress);
      if(available.length == 0)
      {
        break;
      }
      spawnedAnything = false;
      let topPrio = max(available,(r) => r.priority);
      for (const spawn of availableSpawns) {
        let spawnedName: string | null = null;
        switch (topPrio.role) {
          case HARVESTER:
            spawnedName = SpawnHarvester(spawn, topPrio.priority, this.province);
            break;
          case WORKER:
            spawnedName = SpawnWorker(spawn,topPrio.priority,this.province);
            break;
          default: throw new Error("Attempted to spawn unrecognised Role");
        }

        if(spawnedName)
        {
          remove(availableSpawns,(s) => s.id === spawn.id);
          topPrio.inProgress = spawnedName;
        }

        spawnedAnything ||= spawnedName !== null;
      }
    } while (spawnedAnything);


  }
}
