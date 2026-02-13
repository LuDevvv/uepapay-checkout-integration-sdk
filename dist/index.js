"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/workflow-engine/index.ts
var index_exports = {};
__export(index_exports, {
  GuardFailedError: () => GuardFailedError,
  InvalidTransitionError: () => InvalidTransitionError,
  StateNotFoundError: () => StateNotFoundError,
  TransitionValidator: () => TransitionValidator,
  WorkflowEngine: () => WorkflowEngine,
  WorkflowError: () => WorkflowError,
  createWorkflow: () => createWorkflow
});
module.exports = __toCommonJS(index_exports);

// src/workflow-engine/errors/index.ts
var WorkflowError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "WorkflowError";
  }
};
var InvalidTransitionError = class extends WorkflowError {
  constructor(from, to, reason) {
    super(`Invalid transition from '${from}' to '${to}': ${reason || "Not allowed"}`);
    this.name = "InvalidTransitionError";
  }
};
var StateNotFoundError = class extends WorkflowError {
  constructor(state) {
    super(`State '${state}' not defined in workflow`);
    this.name = "StateNotFoundError";
  }
};
var GuardFailedError = class extends WorkflowError {
  constructor(from, to, reasons) {
    super(`Guard failed for transition '${from}' -> '${to}': ${reasons.join(", ")}`);
    this.name = "GuardFailedError";
  }
};

// src/workflow-engine/validators/transition-validator.ts
var TransitionValidator = class {
  constructor(definition) {
    this.definition = definition;
  }
  async validateTransition(from, to, context) {
    if (!this.definition.states[from]) {
      return {
        allowed: false,
        reason: `Source state '${from}' does not exist`,
        errors: [`State '${from}' not found`]
      };
    }
    if (!this.definition.states[to]) {
      return {
        allowed: false,
        reason: `Target state '${to}' does not exist`,
        errors: [`State '${to}' not found`]
      };
    }
    const validTransitions = this.definition.transitions.filter((t) => {
      const matchFrom = Array.isArray(t.from) ? t.from.includes(from) : t.from === from;
      const matchTo = t.to === to;
      return matchFrom && matchTo;
    });
    if (validTransitions.length === 0) {
      return {
        allowed: false,
        reason: `No transition defined from '${from}' to '${to}'`,
        errors: ["Transition not defined"]
      };
    }
    const transitionContext = {
      from,
      to,
      context
    };
    const errors = [];
    let hasPassingRule = false;
    for (const transition of validTransitions) {
      if (!transition.guards || transition.guards.length === 0) {
        hasPassingRule = true;
        break;
      }
      const guardPromises = transition.guards.map(
        (guard) => guard(transitionContext)
      );
      const guardResults = await Promise.all(guardPromises);
      const failedGuards = guardResults.filter((res) => {
        if (typeof res === "boolean") return !res;
        return !res.allowed;
      });
      if (failedGuards.length === 0) {
        hasPassingRule = true;
        break;
      } else {
        failedGuards.forEach((res) => {
          if (typeof res !== "boolean" && res.errors) {
            errors.push(...res.errors);
          } else if (typeof res !== "boolean" && res.reason) {
            errors.push(res.reason);
          } else {
            errors.push("Guard condition failed");
          }
        });
      }
    }
    if (hasPassingRule) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "Guards failed",
      errors: errors.length > 0 ? errors : ["Transition guards failed"]
    };
  }
  async getAllowedTransitions(from, context) {
    if (!this.definition.states[from]) {
      throw new StateNotFoundError(from);
    }
    const potentialTransitions = this.definition.transitions.filter((t) => {
      return Array.isArray(t.from) ? t.from.includes(from) : t.from === from;
    });
    const allowed = [];
    for (const t of potentialTransitions) {
      const result = await this.validateTransition(from, t.to, context);
      if (result.allowed) {
        if (!allowed.includes(t.to)) {
          allowed.push(t.to);
        }
      }
    }
    return allowed;
  }
};

// src/workflow-engine/core/engine.ts
var WorkflowEngine = class {
  constructor(definition) {
    this.definition = definition;
    this.validator = new TransitionValidator(definition);
  }
  getInitialState() {
    return this.definition.initialState;
  }
  async validate(from, to, context) {
    return this.validator.validateTransition(from, to, context);
  }
  async assertTransition(from, to, context) {
    const result = await this.validate(from, to, context);
    if (!result.allowed) {
      throw new InvalidTransitionError(from, to, result.reason || result.errors?.join(", "));
    }
  }
  async transition(from, to, context) {
    await this.assertTransition(from, to, context);
    const transitionContext = { from, to, context };
    const fromState = this.definition.states[from];
    if (fromState && fromState.onLeave) {
      await fromState.onLeave(transitionContext);
    }
    const transitions = this.definition.transitions.filter(
      (t) => (Array.isArray(t.from) ? t.from.includes(from) : t.from === from) && t.to === to
    );
    const activeTransition = transitions[0];
    if (activeTransition && activeTransition.onTransition) {
      await activeTransition.onTransition(transitionContext);
    }
    const toState = this.definition.states[to];
    if (toState && toState.onEnter) {
      await toState.onEnter(transitionContext);
    }
  }
  async getAllowedTransitions(from, context) {
    return this.validator.getAllowedTransitions(from, context);
  }
  getDefinition() {
    return this.definition;
  }
};
function createWorkflow(definition) {
  return new WorkflowEngine(definition);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GuardFailedError,
  InvalidTransitionError,
  StateNotFoundError,
  TransitionValidator,
  WorkflowEngine,
  WorkflowError,
  createWorkflow
});
