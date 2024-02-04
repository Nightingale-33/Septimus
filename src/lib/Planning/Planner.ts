import { AbstractCreep } from "./AbstractCreep";
import { Action } from "../Action";
import { reduce } from "lodash";

export interface Behaviour
{
  PlanNext(creep: AbstractCreep) : Action | null;
}

export class Planner
{
  PlanAheadTime: number;
  decider: Behaviour;

  constructor(lookForward: number = 10, behaviour: Behaviour) {
    this.PlanAheadTime = lookForward;
    this.decider = behaviour;
  }

  Plan(creep: Creep)
  {
    let plan = creep.memory.plan;
    let initialCopy = new AbstractCreep(creep);
    let initialState : [AbstractCreep,number] = [initialCopy,0];
    let [plannedState,executionTime]  = reduce(plan.Steps, ([ac,time],act) => {
      act.apply(ac);
      return [ac,time + act.ApproxTimeLeft(ac)];
      },initialState);

    while(executionTime < this.PlanAheadTime)
    {
      let nextStep = this.decider.PlanNext(plannedState)
      if(nextStep)
      {
        plan.append(nextStep);
        nextStep.apply(plannedState);
        executionTime += nextStep.ApproxTimeLeft(plannedState);
      } else
      {
        break;
      }
    }

  }
}
