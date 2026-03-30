import { Action } from "lib/Action";
import { FillAction } from "lib/Actions/Creep/Action.Fill";
import { IdleAction } from "lib/Actions/Creep/Action.Idle";
import { WithdrawAction } from "lib/Actions/Creep/Action.Withdraw";
import { Delegation } from "lib/Delegation";
import { AbstractCreep } from "lib/Planning/AbstractCreep";
import { EnergyAcquisitionBehaviour } from "lib/Planning/Behaviours/EnergyAcquisition";
import { Behaviour, Planner } from "lib/Planning/Planner";
import { ResourceReservation } from "lib/Reservations/ResourceReservations";
import { HAULER } from "lib/Roles/Role.Hauler";
import { WORKER } from "lib/Roles/Role.Worker";
import { any, filter, forEach, min, sortBy, sum } from "lodash";
import { defaultCreepRequestOptions, Province } from "../Province";
import { log } from "utils/Logging/Logger";

export class SpawnRefiller extends Delegation implements Behaviour
{
    name: string = "SpawnRefiller";
    province : Province;
    get Id(): string {
        return this.province.name+"_"+this.name;
    }

    priority:number = 950_000;

    constructor(province:Province)
    {
        super();
        this.province = province;
        this.planner = new Planner(this,3);
        this.energyAcquisitionBehaviour = new EnergyAcquisitionBehaviour(this.province);
    }

    energyAcquisitionBehaviour : EnergyAcquisitionBehaviour;
    planner : Planner;

    Interrupt(creep: AbstractCreep, afterFirst: AbstractCreep | undefined, nextAction: Action | undefined): Action | null {
        return this.energyAcquisitionBehaviour.Interrupt(creep,afterFirst,nextAction);
    }
    PlanNext(creep: AbstractCreep): Action | null {
        let needsRefill = filter(this.targets,(t) => ResourceReservation.GetPostReservationStore(t,RESOURCE_ENERGY).free > 0);

        if(creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0 && any(needsRefill,(s) => s.pos.inRangeTo(creep,5)))
        {
            let nearest = min(needsRefill,(s) => s.pos.getRangeTo(creep.pos));
            log(3,`Spawn Refill Plan ${creep.name}: Filling ${nearest.id}`);
            return new FillAction(nearest,RESOURCE_ENERGY,creep);
        }

        let freeCapacity = creep.store.getFreeCapacity(RESOURCE_ENERGY);
        if(freeCapacity > 0)
        {
            return this.energyAcquisitionBehaviour.PlanNext(creep);
        }


        if(needsRefill.length > 0)
        {
            let nearest = min(needsRefill,(s) => s.pos.getRangeTo(creep.pos));
            log(3,`Spawn Refill Plan ${creep.name}: Filling ${nearest.id}`);
            return new FillAction(nearest,RESOURCE_ENERGY,creep);
        }

        return new IdleAction();
    }

    get targets(): (StructureSpawn | StructureExtension)[] {
        return global.cache.UseValue(() => filter(this.province.Capital.structures,(s) => s instanceof StructureExtension || s instanceof StructureSpawn) as (StructureSpawn | StructureExtension)[],0,this.Id);
    }

    ShouldExecute(): boolean {
        return any(this.targets,(s) => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
    }
    Execute(): void {
        let totalEnergyToRefill = sum(this.targets, (s) => s.store.getFreeCapacity(RESOURCE_ENERGY));

        let desiredCarryParts = Math.ceil(totalEnergyToRefill / CARRY_CAPACITY);

        let spawnPred = (province:Province)=> {
            return province.creeps.length === 0 ? true : defaultCreepRequestOptions.spawnPredicate!(province);
        }

        for(const pref of this.province.Prefectures)
        {
            if(pref.Defense.ShouldExecute())
            {
                desiredCarryParts *= 2;
            }
        }

        let haulers = this.province.RequestParts([HAULER,WORKER],CARRY,desiredCarryParts,this.Id,this.priority,{deRegisterExcess:true,stealCreeps:true,spawnRoleSelector:(roles) => roles[0], spawnPredicate: spawnPred});

        for(const creep of haulers)
        {
            this.planner.Plan(creep);
        }
    }
}
