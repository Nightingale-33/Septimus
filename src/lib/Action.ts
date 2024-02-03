export abstract class Action {
  abstract Chat: string;

  abstract ApproxTimeLeft(creep: Creep):number;

  cleanup(creep: Creep):void {}

  abstract isValid(creep: Creep): boolean;

  abstract run(creep: Creep) : boolean;
}
