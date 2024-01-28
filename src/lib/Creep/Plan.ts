import { Action } from "../Action";

declare global {
  interface CreepMemory {
    plan: Plan;
  }

  interface Creep {
    executePlan() : void
  }
}

Creep.prototype.executePlan = function()
{
    if(this.memory.plan && this.memory.plan.Steps)
    {

    }
}

export class Plan {
  Steps: Action[];

  constructor(actions: Action[]) {
    this.Steps = actions;
    if(!this.Steps)
    {
      this.Steps = [];
    }
  }

  clear(creep: Creep) : void {
    for(const action of this.Steps)
    {
      action.cleanup(creep);
    }
    this.Steps = [];
  }

  static fromJSON(data: string[]): Plan {
    let actions = data.map((s) => Action.fromJSON(s)).filter((a) : a is Action => a !== null);
    return new Plan(actions);
  }

  toJSON(): Action[] {
    return this.Steps;
  }
}
