import { Delegation } from "lib/Delegation";
import { Province } from '../Province';
import { Behaviour, Planner } from "lib/Planning/Planner";
import { Action } from "lib/Action";
import { AbstractCreep } from "lib/Planning/AbstractCreep";

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
        return null;
    }

    get Terminal() : StructureTerminal | undefined {
        return global.cache.UseValue(() => this.province.structures.find((s) : s is StructureTerminal => s.structureType === STRUCTURE_TERMINAL),5,"Terminal"+this.province.name);
    }

    ShouldExecute(): boolean {
        return this.Terminal !== undefined;
    }
    Execute(): void {

    }



}
