import { Action } from "../Action";
import { all } from "lodash";
import { ActionfromJSON } from "../ActionGenerator";
import { CHATTY } from "../../Constants";
import { log } from "../../utils/Logging/Logger";

declare global {
  interface CreepMemory {
    plan: Plan;
  }

  interface Creep {
    checkPlan(): void;

    executePlan(): void;
  }
}

Creep.prototype.checkPlan = function() {
  if (!this.memory.plan) {
    this.memory.plan = new Plan([]);
  }
  if (!this.memory.plan.Steps) {
    this.memory.plan.Steps = [];
  }

  // if(!all(this.memory.plan.Steps, (step ) => step.isValid(this)))
  // {
  //   this.memory.plan.clear(this);
  // }
};

Creep.prototype.executePlan = function() {
  while (!this.memory.plan.isEmpty()) {
    let step = this.memory.plan.Steps[0];
    if (!step.isValid(this)) {
      log(1,`Plan Step: ${JSON.stringify(step)} is no longer valid`);
      let completedStep = this.memory.plan.Steps.shift();
      if (completedStep) {
        completedStep.cleanup(this);
      }
    } else {
      let result = step.run(this);
      //Todo: Use results to try and multi-task
      break;
    }
  }
  if (CHATTY) {
    if(!this.memory.plan.isEmpty()) {
      let chatPlan = this.memory.plan.Steps.map(a => a.Chat).slice(0, 3).join(">");
      if (this.memory.plan.Steps.length > 3) {
        chatPlan += "+";
        let additional = this.memory.plan.Steps.length - 3;
        if (additional > 1) {
          chatPlan += additional;
        }
      }
      this.say(chatPlan);
    } else
    {
      this.say("🛌");
      log(1,`Creep: ${this.name} is without a plan. Unassigning from: ${this.memory.assignmentId}`);
      delete this.memory.assignmentId;
      delete this.memory.assignmentPriority;
    }
  }
};

export class Plan {
  Steps: Action[];

  constructor(actions: Action[]) {
    this.Steps = actions;
    if (!this.Steps) {
      this.Steps = [];
    }
  }

  clear(creep: Creep): void {
    for (const action of this.Steps) {
      action.cleanup(creep);
    }
    this.Steps = [];
  }

  static fromJSON(data: string[]): Plan {
    let actions = data.map((s) => ActionfromJSON(s)).filter((a): a is Action => a !== null);
    return new Plan(actions);
  }

  toJSON(): Action[] {
    return this.Steps;
  }

  peek(): Action | null {
    return this.Steps.length > 0 ? this.Steps[0] : null;
  }

  isEmpty(): boolean {
    return this.Steps.length === 0;
  }

  append(act: Action) {
    this.Steps.push(act);
  }

  prepend(act: Action) {
    this.Steps.unshift(act);
  }
}
