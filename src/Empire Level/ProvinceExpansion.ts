import { Delegation } from "../lib/Delegation";
import { log } from "../utils/Logging/Logger";

export class ProvinceExpansion extends Delegation
{
    name: string;
    Id: string;
    ShouldExecute(): boolean {
        return Object.keys(global.empire!.Provinces).length < Game.gcl.level;
    }
    Execute(): void {
        log(10,"Thinking about provinces");
    }

}
