import { AbstractCreep } from "./Planning/AbstractCreep";

export abstract class Action {
  abstract Chat: string;
  abstract Name: string;

  abstract ApproxTimeLeft(creep: AbstractCreep):number;

  cleanup(creep: Creep):void {}

  abstract isValid(creep: Creep): boolean;

  abstract run(creep: Creep) : boolean;

  abstract apply(ac: AbstractCreep) : void;
}
