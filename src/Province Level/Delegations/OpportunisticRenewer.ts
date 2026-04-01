import { Delegation } from "lib/Delegation";
import { Role } from "lib/Roles/Role";
import { HAULER } from "lib/Roles/Role.Hauler";
import { WORKER } from "lib/Roles/Role.Worker";
import { any, filter, forEach, map, min } from "lodash";
import { Province } from "Province Level/Province";
import { AvailableSpawnEnergy, GetBodyCost } from "utils/SpawnUtils";

export class OpportunisticRenewer extends Delegation {
    name: string = "OpportunisticRenewer";

    get Id(): string {
        return `${this.province.name}_${this.name}`;
    }

    province : Province;

    constructor(province: Province)
    {
        super();
        this.province = province;
    }

    ShouldExecute(): boolean {
        return any(this.province.spawns, (sp) => sp.isActive() && !sp.spawning);
    }

    renewableRoles : Role[] = [HAULER,WORKER];

    renewAmount(creep : Creep) : number {
        return Math.floor(600/creep.body.length);
    }

    energyToRenew(creep : Creep) : number {
        let simpleBodyType = map(creep.body,(b) => b.type);
        return Math.ceil(GetBodyCost(simpleBodyType)/2.5/creep.body.length)
    }

    Execute(): void {
        for(const spawn of this.province.spawns)
        {
            let availableEnergy = AvailableSpawnEnergy(spawn);
            let nearbyCreeps = filter(this.province.creeps,(c) => this.renewableRoles.includes(c.memory.role)
            && !c.spawning
            && !any(c.body, (b) => b.boost !== undefined)
            && (c.ticksToLive ?? 2000) < (CREEP_LIFE_TIME - this.renewAmount(c))
            && availableEnergy >= this.energyToRenew(c)
            && c.pos.getRangeTo(spawn) <= 1);

            if(nearbyCreeps.length > 0)
            {
                let closestToDeath = min(nearbyCreeps, (c) => c.ticksToLive);
                spawn.renewCreep(closestToDeath);
            }
        }
    }

}
