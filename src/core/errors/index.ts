export class WorkflowError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "WorkflowError";
    }
}

export class InvalidTransitionError extends WorkflowError {
    constructor(from: string, to: string, reason?: string) {
        super(`Invalid transition from '${from}' to '${to}': ${reason || "Not allowed"}`);
        this.name = "InvalidTransitionError";
    }
}

export class StateNotFoundError extends WorkflowError {
    constructor(state: string) {
        super(`State '${state}' not defined in workflow`);
        this.name = "StateNotFoundError";
    }
}

export class GuardFailedError extends WorkflowError {
    constructor(from: string, to: string, reasons: string[]) {
        super(`Guard failed for transition '${from}' -> '${to}': ${reasons.join(", ")}`);
        this.name = "GuardFailedError";
    }
}
