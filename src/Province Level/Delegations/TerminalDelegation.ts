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

export class TerminalDelegation extends Delegation implements Behaviour {
    name: string = "TerminalManager";
    province : Province;
    get Id(): string {
        return this.province.name + "_" + this.name;
    }

    Planner: Planner;

    constructor(province: Province) {
        super();
        this.province = province;
        this.Planner = new Planner(this);
    }
    Interrupt(creep: AbstractCreep, afterFirst: AbstractCreep | undefined, nextAction: Action | undefined): Action | null {
        return null;
    }
    PlanNext(creep: AbstractCreep): Action | null {
        if(creep.store.getFreeCapacity() == 0 || (creep.store.getUsedCapacity() > 0 && creep.pos.inRangeTo(this.Terminal!,5)))
        {
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
            //Look for minerals
            let containers = sortBy(filter(this.province.structures, (s) : s is StructureContainer => s instanceof StructureContainer),(s) => s.pos.getMultiRoomRangeTo(creep.pos)) as StructureContainer[];
            let mineralContainer = containers.find((container) => (container.store.getUsedCapacity() - container.store.getUsedCapacity(RESOURCE_ENERGY)) > 0);
            if(mineralContainer)
            {
                for(const key in mineralContainer.store)
                {
                    if(key == RESOURCE_ENERGY)
                    {
                        continue;
                    }
                    if(ResourceReservation.GetPostReservationStore(mineralContainer,key as ResourceConstant).free > 0)
                    {
                        return new WithdrawAction(mineralContainer,key as ResourceConstant,creep,false);
                    }
                }
            }

            if(ResourceReservation.GetPostReservationStore(this.Terminal!,RESOURCE_ENERGY).used >= 100_000)
            {
                return new IdleAction();
            }

            if(containers[0])
            {
                if(ResourceReservation.GetPostReservationStore(containers[0],RESOURCE_ENERGY).used >= creep.store.getFreeCapacity())
                {
                    return new WithdrawAction(containers[0],RESOURCE_ENERGY,creep);
                }
            }

            if(this.province.storage)
            {
                let postReservationAmount = ResourceReservation.GetPostReservationStore(this.province.storage,RESOURCE_ENERGY,true).used;
                if(postReservationAmount >= 100_000 && (postReservationAmount - 100_000) >= creep.store.getFreeCapacity())
                {
                    return new WithdrawAction(this.province.storage,RESOURCE_ENERGY,creep);
                }
            }
        }

        return null;
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
            return;
        }

        for (const creep of dedicatedHauler)
        {
            this.Planner.Plan(creep);
        }
    }



}
