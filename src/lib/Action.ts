export abstract class Action {
  abstract Chat: string;

  cleanup(creep: Creep):void {}

  abstract isValid(creep: Creep): boolean;

  abstract run(creep: Creep) : boolean;
}
