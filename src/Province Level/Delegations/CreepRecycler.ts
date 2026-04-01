import { MoveAction } from "lib/Actions/Creep/Action.Move";
import { Delegation } from "lib/Delegation";
import { LEGIONNAIRE } from "lib/Roles/Combat/Role.Legionnaire";
import { SPEARMAN } from "lib/Roles/Combat/Role.Spearman";
import { Role } from "lib/Roles/Role";
import { HARVESTER } from "lib/Roles/Role.Harvester";
import { any, filter, min } from "lodash";
import { Province } from "Province Level/Province";

export class Recycler extends Delegation
{
    name: string;
    Id: string;

    province : Province;

    constructor(province : Province)
    {
        super();
        this.province = province;
    }

    rolesToRecycle: Role[] = [LEGIONNAIRE,SPEARMAN,HARVESTER];

    ShouldExecute(): boolean {
        return any(this.province.creeps, (c) => this.rolesToRecycle.includes(c.memory.role) && c.memory.assignmentId === undefined);
    }

    Execute(): void {
        let aSpawn = this.province.spawns[0];
        if(!aSpawn)
        {
            throw new Error("There are no spawns for this province");
        }

        console.log(`Checking data: ${JSON.stringify(aSpawn)}`);

        let recyclableCreeps = filter(this.province.creeps, (c) =>
        this.rolesToRecycle.includes(c.memory.role)
        && ! c.spawning
        && c.memory.assignmentId === undefined
        && any(c.body,(b) => b.type === MOVE && b.hits > 0) //Prevent nearly dead stalled creeps
        && (c.ticksToLive ?? 0) > c.pos.getMultiRoomRangeTo(aSpawn.pos)
        );

        for(const creep of recyclableCreeps)
        {
            //If it is here then recycle it
            if(creep.pos.inRangeTo(aSpawn,1))
            {
                aSpawn.recycleCreep(creep);
                return;
            }

            if(creep.memory.plan.isEmpty())
            {
                creep.memory.plan.append(new MoveAction(aSpawn.pos,1,true));
            }
        }
    }

}
