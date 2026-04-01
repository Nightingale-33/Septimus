import { Delegation } from "lib/Delegation";
import { Province } from '../Province';
import { Behaviour, Planner } from "lib/Planning/Planner";
import { Action } from "lib/Action";
import { AbstractCreep } from "lib/Planning/AbstractCreep";
import { HAULER } from "lib/Roles/Role.Hauler";
import { FillAction } from "lib/Actions/Creep/Action.Fill";
import { filter, forEach, max, min, sortBy } from "lodash";
import { ResourceReservation } from "lib/Reservations/ResourceReservations";
import { WithdrawAction } from "lib/Actions/Creep/Action.Withdraw";
import { IdleAction } from "lib/Actions/Creep/Action.Idle";
import { log } from "utils/Logging/Logger";
import { PickupAction } from "lib/Actions/Creep/Action.Pickup";
import { EnergyAcquisitionBehaviour } from "lib/Planning/Behaviours/EnergyAcquisition";

export class TerminalDelegation extends Delegation implements Behaviour {
    name: string = "TerminalManager";
    province : Province;
    get Id(): string {
        return this.province.name + "_" + this.name;
    }

    energyAcquisitionBehaviour : EnergyAcquisitionBehaviour;
    Planner: Planner;

    constructor(province: Province) {
        super();
        this.province = province;
        this.Planner = new Planner(this);
        this.energyAcquisitionBehaviour = new EnergyAcquisitionBehaviour(this.province);
        this.energyAcquisitionBehaviour.storageBuffer = 100_000;
    }
    Interrupt(creep: AbstractCreep, afterFirst: AbstractCreep | undefined, nextAction: Action | undefined): Action | null {
        return null;
    }
    PlanNext(creep: AbstractCreep): Action | null {
        if(creep.store.getFreeCapacity() == 0 || (creep.store.getUsedCapacity() > 0 && creep.pos.inRangeTo(this.Terminal!,5)))
        {
            log(1,`Terminal Plan ${creep.name}: filling Terminal`);
            for(const fillType in creep.store.contents)
            {
                if(creep.store.contents[fillType] > 0)
                {
                    return new FillAction(this.Terminal!,fillType as ResourceConstant,creep);
                }
            }
        }

        if(creep.store.getFreeCapacity() > 0)
        {
            log(1,`Terminal Plan ${creep.name}: Looking for minerals to carry`)
            //Look for minerals
            let tombStones = sortBy(filter(this.province.Capital.room.find(FIND_TOMBSTONES),(t) => (t.store.getUsedCapacity() - t.store.getUsedCapacity(RESOURCE_ENERGY)) > 0),(t) => t.ticksToDecay);
            if(tombStones[0])
            {
                for(const key in tombStones[0].store)
                {
                    if(key == RESOURCE_ENERGY)
                    {
                        continue;
                    }
                    if(ResourceReservation.GetPostReservationStore(tombStones[0],key as ResourceConstant).used > 0)
                    {
                        log(1,`Terminal Plan ${creep.name}: Withdrawing from a Tombstone`)
                        return new WithdrawAction(tombStones[0],key as ResourceConstant,creep,false);
                    }
                }
            }

            let droppedMinerals = sortBy(filter(this.province.Capital.room.find(FIND_DROPPED_RESOURCES),(r) => r.resourceType !== RESOURCE_ENERGY),(r) => r.pos.getMultiRoomRangeTo(creep.pos));
            if(droppedMinerals[0])
            {
                log(1,`Terminal Plan ${creep.name}: Picking up loose minerals`);
                return new PickupAction(droppedMinerals[0],creep);
            }

            let containers = sortBy(filter(this.province.structures, (s) : s is StructureContainer => s instanceof StructureContainer),(s) => s.pos.getMultiRoomRangeTo(creep.pos)) as StructureContainer[];
            //At least one carry part worth
            let mineralContainer = containers.find((container) => (container.store.getUsedCapacity() - container.store.getUsedCapacity(RESOURCE_ENERGY)) >= 50);
            if(mineralContainer)
            {
                for(const key in mineralContainer.store)
                {
                    if(key == RESOURCE_ENERGY)
                    {
                        continue;
                    }
                    if(ResourceReservation.GetPostReservationStore(mineralContainer,key as ResourceConstant).used > 0)
                    {
                        log(1,`Terminal Plan ${creep.name}: Withdrawing Minerals from a container`);
                        return new WithdrawAction(mineralContainer,key as ResourceConstant,creep,false);
                    }
                }
            }

            if(ResourceReservation.GetPostReservationStore(this.Terminal!,RESOURCE_ENERGY).used < 100_000)
            {
                log(1,`Terminal Plan ${creep.name}: Looking for energy`);

                return this.energyAcquisitionBehaviour.PlanNext(creep);
            }
        }

        if(creep.store.getUsedCapacity() > 0)
        {
            for(const fillType in creep.store.contents)
            {
                if(creep.store.contents[fillType] > 0)
                {
                    log(1,`Terminal Plan ${creep.name}: Filling Terminal with whatever is on hand`);
                    return new FillAction(this.Terminal!,fillType as ResourceConstant,creep);
                }
            }
        }

        log(1,`Could not determine a plan for ${creep.name} as part of Terminal filling`);

        return new IdleAction();
    }

    get Terminal() : StructureTerminal | undefined {
        return this.province.Capital.room.terminal;
    }

    ShouldExecute(): boolean {
        return this.Terminal !== undefined && this.Terminal.isActive();
    }
    Execute(): void {
        //Do terminal stuff
        if(this.Terminal!.cooldown === 0)
        {
            for(const resource in this.Terminal!.store)
            {
                let resourceKey = resource as ResourceConstant;
                let amountInStore = this.Terminal!.store[resourceKey];
                if(resourceKey === RESOURCE_ENERGY && amountInStore <= 150_000)
                {
                    continue;
                }

                if(amountInStore > 0)
                {
                    let relevantOrders = Game.market.getAllOrders((o) => o.resourceType === resourceKey && o.type === ORDER_BUY);
                    if(relevantOrders.length === 0)
                    {
                        continue;
                    }

                    let bestOrder = max(relevantOrders,(o) => o.price);

                    let sellAmount = Math.min(bestOrder.remainingAmount,amountInStore);

                    let estimatedCost = Game.market.calcTransactionCost(sellAmount,this.Terminal!.room.name,bestOrder.roomName!);

                    if(resourceKey === RESOURCE_ENERGY)
                    {
                        sellAmount = Math.min(bestOrder.remainingAmount,amountInStore - estimatedCost);
                    }

                    if(sellAmount <= 0 || estimatedCost >= this.Terminal!.store.getUsedCapacity(RESOURCE_ENERGY))
                    {
                        continue;
                    }

                    let returnCode = Game.market.deal(bestOrder.id,sellAmount,this.Terminal?.room.name);

                    if(returnCode !== OK)
                    {
                        log(1,`Attempted to sell ${resourceKey} at ${bestOrder.price} and for ${sellAmount} of quantity but the return code was: ${returnCode}`);
                    } else
                    {
                        log(1,`Successfully sold ${resourceKey} at ${bestOrder.price} for ${sellAmount} of quantity`);
                    }
                }
            }
        }

        let dedicatedHauler = this.province.RequestCreeps(HAULER,1,this.Id,30);

        if(dedicatedHauler.length == 0)
        {
            log(1,`No creeps available for Terminal`);
            return;
        }

        for (const creep of dedicatedHauler)
        {
            log(1,`Planning for ${creep.name} as part of Terminal`);
            this.Planner.Plan(creep);
        }
    }



}
