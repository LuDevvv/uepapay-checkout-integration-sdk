import {
    WorkflowDefinition,
    TransitionContext,
    ValidationResult,
    StateIdentifier,
} from "../types";
import { StateNotFoundError } from "../errors";

export class TransitionValidator<TContext = any> {
    constructor(private definition: WorkflowDefinition<TContext>) { }

    public async validateTransition(
        from: StateIdentifier,
        to: StateIdentifier,
        context: TContext
    ): Promise<ValidationResult> {
        // 1. Validate State Existence
        if (!this.definition.states[from]) {
            return {
                allowed: false,
                reason: `Source state '${from}' does not exist`,
                errors: [`State '${from}' not found`],
            };
        }
        if (!this.definition.states[to]) {
            return {
                allowed: false,
                reason: `Target state '${to}' does not exist`,
                errors: [`State '${to}' not found`],
            };
        }

        // 2. Find matching transitions
        const validTransitions = this.definition.transitions.filter((t) => {
            const matchFrom = Array.isArray(t.from)
                ? t.from.includes(from)
                : t.from === from;
            const matchTo = t.to === to;
            return matchFrom && matchTo;
        });

        if (validTransitions.length === 0) {
            return {
                allowed: false,
                reason: `No transition defined from '${from}' to '${to}'`,
                errors: ["Transition not defined"],
            };
        }

        // 3. Evaluate Guards
        const transitionContext: TransitionContext<TContext> = {
            from,
            to,
            context,
        };

        const errors: string[] = [];

        for (const transition of validTransitions) {
            if (!transition.guards || transition.guards.length === 0) {
                return { allowed: true, matchedTransition: transition };
            }

            // Execute guards in parallel
            const guardPromises = transition.guards.map((guard) =>
                guard(transitionContext)
            );

            const guardResults = await Promise.all(guardPromises);

            const failedGuards = guardResults.filter((res) => {
                if (typeof res === "boolean") return !res;
                return !res.allowed;
            });

            if (failedGuards.length === 0) {
                return { allowed: true, matchedTransition: transition };
            } else {
                // Collect errors from this specific rule attempt
                failedGuards.forEach((res) => {
                    if (typeof res !== 'boolean' && res.errors) {
                        errors.push(...res.errors);
                    } else if (typeof res !== 'boolean' && res.reason) {
                        errors.push(res.reason);
                    } else {
                        errors.push("Guard condition failed");
                    }
                });
            }
        }

        return {
            allowed: false,
            reason: "Guards failed",
            errors: errors.length > 0 ? errors : ["Transition guards failed"],
        };
    }

    public async getAllowedTransitions(from: StateIdentifier, context: TContext): Promise<StateIdentifier[]> {
        if (!this.definition.states[from]) {
            throw new StateNotFoundError(from);
        }

        const potentialTransitions = this.definition.transitions.filter(t => {
            return Array.isArray(t.from) ? t.from.includes(from) : t.from === from;
        });

        const allowed: StateIdentifier[] = [];

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
}
