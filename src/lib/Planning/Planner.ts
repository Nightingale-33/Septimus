import { AbstractCreep } from "./AbstractCreep";
import { Action } from "../Action";
import { reduce } from "lodash";
import { log } from "../../utils/Logging/Logger";
import { TRACE_FLAG } from "../../utils/Logging/FlagDecs";
import { IdleAction } from "../Actions/Creep/Action.Idle";

export interface Behaviour
{
  Interrupt(creep: AbstractCreep, afterFirst : AbstractCreep | undefined, nextAction: Action | undefined) : Action | null;
  PlanNext(creep: AbstractCreep) : Action | null;
}

export class Planner
{
  PlanAheadTime: number;
  decider: Behaviour;

  constructor(behaviour: Behaviour,lookForward: number = 10) {
    this.PlanAheadTime = lookForward;
    this.decider = behaviour;
  }

  Plan(creep: Creep)
  {
    if(creep.spawning)
    {
      return;
    }

    let plan = creep.memory.plan;
    if (plan.peek() instanceof IdleAction) {
      plan.clear(creep);
    }
    let initialCopy = new AbstractCreep(creep);
    let afterFirst: AbstractCreep = new AbstractCreep(initialCopy);
    let interruptAction: Action | null = null;
    let firstAction = plan.peek();
    if(!firstAction)
    {
      interruptAction = this.decider.Interrupt(initialCopy,undefined,undefined);
    } else
    {
      firstAction.apply(afterFirst);
      interruptAction = this.decider.Interrupt(initialCopy,afterFirst,firstAction);
    }

    if(interruptAction)
    {
      log(1,`Plan interrupt action: ${interruptAction.Name} for ${creep.name}`);
      plan.prepend(interruptAction);
    }
    let initialState : [AbstractCreep,number] = [initialCopy,0];

    let [plannedState,executionTime]  = reduce(plan.Steps, ([ac,time],act) => {
      let newTime = time + act.ApproxTimeLeft(ac);
      act.apply(ac);
      return [ac,newTime];
      },initialState);

    log(TRACE_FLAG, `Creep: ${creep.name} has a plan of ${plan.Steps.length} length and taking: ${executionTime}Ticks`);
    log(TRACE_FLAG, `Planning from a state of: ${JSON.stringify(plannedState)}`);

    while(executionTime < this.PlanAheadTime)
    {
      let nextStep = this.decider.PlanNext(plannedState)
      if(nextStep)
      {
        plan.append(nextStep);
        executionTime += Math.max(1,nextStep.ApproxTimeLeft(plannedState));
        nextStep.apply(plannedState);
        log(TRACE_FLAG, `State after action: ${nextStep.Name}: Time:${executionTime}, State: ${JSON.stringify(plannedState)}`);
      } else
      {
        break;
      }
    }

  }
}
