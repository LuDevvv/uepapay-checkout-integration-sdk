/**
 * Unique identifier for a state (e.g., 'PENDING', 'PAID').
 */
type StateIdentifier = string;
/**
 * Result of a transition validation attempt.
 */
interface ValidationResult {
    /** Whether the transition is allowed. */
    allowed: boolean;
    /** Reason for failure if not allowed. */
    reason?: string;
    /** List of specific error messages (e.g., from multiple failing guards). */
    errors?: string[];
    /** The transition definition that matched and passed validation (if allowed). */
    matchedTransition?: TransitionDefinition;
}
/**
 * Context passed to guards and actions during a transition.
 */
interface TransitionContext<TContext = any> {
    from: StateIdentifier;
    to: StateIdentifier;
    context: TContext;
}
/**
 * A function that determines if a transition is allowed.
 * Can return a boolean, a ValidationResult, or a Promise of either.
 */
type Guard<TContext = any> = (context: TransitionContext<TContext>) => boolean | ValidationResult | Promise<boolean | ValidationResult>;
/**
 * A side-effect function executed during state transitions.
 */
type Action<TContext = any> = (context: TransitionContext<TContext>) => void | Promise<void>;
/**
 * Definition of a valid transition between states.
 */
interface TransitionDefinition<TContext = any> {
    /** Source state(s). Can be a single state or an array of states. */
    from: StateIdentifier | StateIdentifier[];
    /** Target state. */
    to: StateIdentifier;
    /** Array of guards that must all pass for the transition to be valid. */
    guards?: Guard<TContext>[];
    /** Action to execute when this specific transition occurs. */
    onTransition?: Action<TContext>;
    /** Human-readable label for the transition (e.g., for UI). */
    label?: string;
}
/**
 * Definition of a state in the workflow.
 */
interface StateDefinition<TContext = any> {
    /** Unique name of the state. */
    name: StateIdentifier;
    /** Optional description. */
    description?: string;
    /** Whether this state is a terminal state (no outgoing transitions expected). */
    isTerminal?: boolean;
    /** Action to execute when entering this state. */
    onEnter?: Action<TContext>;
    /** Action to execute when leaving this state. */
    onLeave?: Action<TContext>;
    /** Custom metadata for the state. */
    meta?: Record<string, any>;
}
/**
 * Complete definition of a workflow.
 */
interface WorkflowDefinition<TContext = any> {
    name: string;
    initialState: StateIdentifier;
    states: Record<StateIdentifier, StateDefinition<TContext>>;
    transitions: TransitionDefinition<TContext>[];
}

declare class WorkflowError extends Error {
    constructor(message: string);
}
declare class InvalidTransitionError extends WorkflowError {
    constructor(from: string, to: string, reason?: string);
}
declare class StateNotFoundError extends WorkflowError {
    constructor(state: string);
}
declare class GuardFailedError extends WorkflowError {
    constructor(from: string, to: string, reasons: string[]);
}

declare class TransitionValidator<TContext = any> {
    private definition;
    constructor(definition: WorkflowDefinition<TContext>);
    validateTransition(from: StateIdentifier, to: StateIdentifier, context: TContext): Promise<ValidationResult>;
    getAllowedTransitions(from: StateIdentifier, context: TContext): Promise<StateIdentifier[]>;
}

declare class WorkflowEngine<TContext = any> {
    private definition;
    private validator;
    constructor(definition: WorkflowDefinition<TContext>);
    getInitialState(): StateIdentifier;
    validate(from: StateIdentifier, to: StateIdentifier, context: TContext): Promise<ValidationResult>;
    assertTransition(from: StateIdentifier, to: StateIdentifier, context: TContext): Promise<void>;
    transition(from: StateIdentifier, to: StateIdentifier, context: TContext): Promise<void>;
    getAllowedTransitions(from: StateIdentifier, context: TContext): Promise<StateIdentifier[]>;
    getDefinition(): WorkflowDefinition<TContext>;
}
declare function createWorkflow<TContext = any>(definition: WorkflowDefinition<TContext>): WorkflowEngine<TContext>;

export { type Action, type Guard, GuardFailedError, InvalidTransitionError, type StateDefinition, type StateIdentifier, StateNotFoundError, type TransitionContext, type TransitionDefinition, TransitionValidator, type ValidationResult, type WorkflowDefinition, WorkflowEngine, WorkflowError, createWorkflow };
