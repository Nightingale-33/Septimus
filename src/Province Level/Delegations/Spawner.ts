import { Delegation } from "../../lib/Delegation";
import { Province } from "../Province";
import { Role } from "../../lib/Roles/Role";
import { max, remove } from "lodash";
import { HARVESTER, SpawnHarvester } from "../../lib/Roles/Role.Harvester";
import { SpawnWorker, WORKER } from "../../lib/Roles/Role.Worker";
import { log } from "../../utils/Logging/Logger";
import { HAULER, SpawnHauler } from "../../lib/Roles/Role.Hauler";
import { SCOUT, SpawnScout } from "../../lib/Roles/Role.Scout";
import { CLAIMER, SpawnClaimer } from "../../lib/Roles/Role.Claimer";
import { LEGIONNAIRE, SpawnLegionnaire } from "../../lib/Roles/Combat/Role.Legionnaire";

export class Spawner extends Delegation {
  name: string = "Spawner_";
  province: Province;

  get Id() : string {return this.province.name + "_Spawner"};

  SpawnRequests: { id: string, role: Role, priority: number ,inProgress: string | undefined }[] = [];

  constructor(prov: Province) {
    super();
    this.province = prov;
    this.name += this.province.name;
  }

  RequestCreepSpawn(role: Role,requesterId:string, priority:number = 1)
  {
    if(!this.SpawnRequests.find((r) => r.id === requesterId && r.role === role))
    {
      log(1,`Requesting ${role} for: ${requesterId}`);
      this.SpawnRequests.push({id: requesterId,role:role,priority:priority,inProgress: undefined});
    }
  }

  ShouldExecute(): boolean {
    return this.SpawnRequests.length > 0;
  }

  Execute(): void {
    if(this.SpawnRequests.length === 0)
    {
      throw new Error("Spawner was executed with no requests");
    }

    remove(this.SpawnRequests, (r) => r.inProgress && Game.creeps[r.inProgress]);

    log(2,`Spawn Queue: ${JSON.stringify(this.SpawnRequests)}`);

    let availableSpawns = this.province.spawns.filter((s) => !s.spawning);

    let spawnedAnything: boolean;
    do {
      let available = this.SpawnRequests.filter((r) => !r.inProgress);
      if(available.length == 0)
      {
        log(2,"No available spawns");
        break;
      }
      spawnedAnything = false;
      let topPrio = max(available,(r) => r.priority);
      for (const spawn of availableSpawns) {
        let spawnedName: string | null = null;
        switch (topPrio.role) {
          case HARVESTER:
            spawnedName = SpawnHarvester(spawn, this.province);
            break;
          case WORKER:
            spawnedName = SpawnWorker(spawn,this.province);
            break;
          case HAULER:
            spawnedName = SpawnHauler(spawn,this.province);
            break;
          case SCOUT:
            spawnedName = SpawnScout(spawn,this.province);
            break;
          case CLAIMER:
            spawnedName = SpawnClaimer(spawn,this.province);
            break;
          case LEGIONNAIRE:
            spawnedName = SpawnLegionnaire(spawn,this.province);
            break;
          default: throw new Error("Attempted to spawn unrecognised Role");
        }

        if(spawnedName)
        {
          remove(availableSpawns,(s) => s.id === spawn.id);
          topPrio.inProgress = spawnedName;
        } else
        {
          log(2,`Did not spawn a ${topPrio.role} for ${topPrio.id}`);
        }

        spawnedAnything ||= spawnedName !== null;
      }
    } while (spawnedAnything);


  }
}
