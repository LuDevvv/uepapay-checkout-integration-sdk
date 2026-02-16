
export class UepaPayError extends Error {
    constructor(
        message: string,
        public code?: string,
        public details?: any
    ) {
        super(message);
        this.name = 'UepaPayError';
        // Restore prototype chain for instanceof checks
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
