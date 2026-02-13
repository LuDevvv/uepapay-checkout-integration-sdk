import { WorkflowDefinition, StateIdentifier, ValidationResult } from "../types";
import { TransitionValidator } from "../validators/transition-validator";
import { InvalidTransitionError } from "../errors";

export class WorkflowEngine<TContext = any> {
    private validator: TransitionValidator;

    /**
     * Initializes a new instance of the Workflow Engine.
     * @param definition The workflow definition containing states and transitions.
     */
    constructor(private definition: WorkflowDefinition<TContext>) {
        this.validator = new TransitionValidator<TContext>(definition);
    }

    /**
     * returns the initial state of the workflow.
     */
    public getInitialState(): StateIdentifier {
        return this.definition.initialState;
    }

    /**
     * Validates if a transition is allowed from the source state to the target state with the given context.
     * @returns A promise that resolves to a ValidationResult.
     */
    public async validate(from: StateIdentifier, to: StateIdentifier, context: TContext): Promise<ValidationResult> {
        return this.validator.validateTransition(from, to, context);
    }

    /**
     * Asserts that a transition is allowed. Throws an error if validation fails.
     * @throws {InvalidTransitionError} If the transition is not allowed.
     */
    public async assertTransition(from: StateIdentifier, to: StateIdentifier, context: TContext): Promise<void> {
        const result = await this.validate(from, to, context);
        if (!result.allowed) {
            throw new InvalidTransitionError(from, to, result.reason || result.errors?.join(", "));
        }
    }

    /**
     * Executes a state transition.
     * 
     * 1. Validates the transition.
     * 2. Executes 'onLeave' hooks of the source state.
     * 3. Executes 'onTransition' hooks of the matched transition.
     * 4. Executes 'onEnter' hooks of the target state.
     * 
     * @throws {InvalidTransitionError} If validation fails.
     */
    public async transition(from: StateIdentifier, to: StateIdentifier, context: TContext): Promise<void> {
        // We call validate directly to get the matched transition
        const result = await this.validate(from, to, context);
        if (!result.allowed) {
            throw new InvalidTransitionError(from, to, result.reason || result.errors?.join(", "));
        }

        const transitionContext = { from, to, context };

        // 1. Execute onLeave hooks for 'from' state
        const fromState = this.definition.states[from];
        if (fromState && fromState.onLeave) {
            await fromState.onLeave(transitionContext);
        }

        // 2. Execute onTransition hooks for the specific transition
        // We use the transition that actually passed validation
        const activeTransition = result.matchedTransition;
        if (activeTransition && activeTransition.onTransition) {
            await activeTransition.onTransition(transitionContext);
        }

        // 3. Execute onEnter hooks for 'to' state
        const toState = this.definition.states[to];
        if (toState && toState.onEnter) {
            await toState.onEnter(transitionContext);
        }
    }

    /**
     * Returns a list of all allowed target states from the current state.
     */
    public async getAllowedTransitions(from: StateIdentifier, context: TContext): Promise<StateIdentifier[]> {
        return this.validator.getAllowedTransitions(from, context);
    }

    /**
     * Returns the full workflow definition.
     */
    public getDefinition(): WorkflowDefinition<TContext> {
        return this.definition;
    }
}

/**
 * Factory function to create a new WorkflowEngine instance.
 * @param definition The workflow definition.
 * @returns A new WorkflowEngine instance.
 */
export function createWorkflow<TContext = any>(definition: WorkflowDefinition<TContext>): WorkflowEngine<TContext> {
    return new WorkflowEngine(definition);
}
