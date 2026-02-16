
import { describe, it, expect, vi } from 'vitest';
import { createWorkflow, WorkflowDefinition } from '../src/core';

// Define States
const PaymentState = {
    CREATED: 'CREATED',
    PROCESSING: 'PROCESSING',
    SUCCESS: 'SUCCESS',
    REJECTED: 'REJECTED',
    REFUNDED: 'REFUNDED'
};

// Define Context
interface PaymentContext {
    orderId: string;
    amount: number;
    paidAmount?: number;
    isDuplicate?: boolean;
}

// Define Workflow
const paymentWorkflowDef: WorkflowDefinition<PaymentContext> = {
    name: 'UepaPayPaymentWorkflow',
    initialState: PaymentState.CREATED,
    states: {
        [PaymentState.CREATED]: { name: PaymentState.CREATED },
        [PaymentState.PROCESSING]: {
            name: PaymentState.PROCESSING,
            onEnter: async () => console.log('Entering PROCESSING state') // Mock effect
        },
        [PaymentState.SUCCESS]: { name: PaymentState.SUCCESS, isTerminal: true },
        [PaymentState.REJECTED]: { name: PaymentState.REJECTED, isTerminal: true },
        [PaymentState.REFUNDED]: { name: PaymentState.REFUNDED, isTerminal: true }
    },
    transitions: [
        {
            from: PaymentState.CREATED,
            to: PaymentState.PROCESSING,
            label: 'Start Processing'
        },
        {
            from: PaymentState.PROCESSING,
            to: PaymentState.SUCCESS,
            label: 'Payment Approved',
            guards: [
                async ({ context }) => {
                    // Simulate async database check
                    await new Promise(resolve => setTimeout(resolve, 10));
                    if (context.isDuplicate) {
                        return { allowed: false, reason: 'Duplicate payment detected' };
                    }
                    return true;
                },
                ({ context }) => {
                    if (context.paidAmount !== undefined && context.paidAmount < context.amount) {
                        return { allowed: false, reason: 'Insufficient payment amount' };
                    }
                    return true;
                }
            ]
        },
        {
            from: PaymentState.PROCESSING,
            to: PaymentState.REJECTED,
            label: 'Payment Declined'
        },
        {
            from: PaymentState.SUCCESS,
            to: PaymentState.REFUNDED,
            label: 'Refund Payment'
        }
    ]
};

describe('Payment Workflow Engine', () => {
    const engine = createWorkflow(paymentWorkflowDef);

    it('should initialize with correct state', () => {
        expect(engine.getInitialState()).toBe(PaymentState.CREATED);
    });

    it('should allow generic transition from CREATED to PROCESSING', async () => {
        const result = await engine.validate(PaymentState.CREATED, PaymentState.PROCESSING, { orderId: '123', amount: 100 });
        expect(result.allowed).toBe(true);
    });

    it('should validate async guards for SUCCESS transition', async () => {
        // Case 1: Insufficient amount
        const context1: PaymentContext = { orderId: '123', amount: 100, paidAmount: 50 };
        const result1 = await engine.validate(PaymentState.PROCESSING, PaymentState.SUCCESS, context1);
        expect(result1.allowed).toBe(false);
        expect(result1.reason).toBe('Guards failed');
        expect(result1.errors).toContain('Insufficient payment amount');

        // Case 2: Duplicate (Async Check)
        const context2: PaymentContext = { orderId: '123', amount: 100, paidAmount: 100, isDuplicate: true };
        const result2 = await engine.validate(PaymentState.PROCESSING, PaymentState.SUCCESS, context2);
        expect(result2.allowed).toBe(false);
        expect(result2.errors).toContain('Duplicate payment detected');

        // Case 3: Valid
        const context3: PaymentContext = { orderId: '123', amount: 100, paidAmount: 100, isDuplicate: false };
        const result3 = await engine.validate(PaymentState.PROCESSING, PaymentState.SUCCESS, context3);
        expect(result3.allowed).toBe(true);
    });

    it('should prevent invalid transitions', async () => {
        // Direct jump from CREATED to SUCCESS not allowed by definition
        const result = await engine.validate(PaymentState.CREATED, PaymentState.SUCCESS, { orderId: '123', amount: 100 });
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('No transition defined');
    });

    it('should execute hooks on transition', async () => {
        const onEnterSpy = vi.fn();
        const onLeaveSpy = vi.fn();
        const onTransitionSpy = vi.fn();

        const hookWorkflowDef: WorkflowDefinition = {
            name: 'HookTest',
            initialState: 'A',
            states: {
                A: { name: 'A', onLeave: onLeaveSpy },
                B: { name: 'B', onEnter: onEnterSpy }
            },
            transitions: [
                { from: 'A', to: 'B', onTransition: onTransitionSpy }
            ]
        };

        const hookEngine = createWorkflow(hookWorkflowDef);

        // Use the new transition method that executes hooks
        // Note: engine.transition is not yet in the interface but we added it to the class in previous step
        // We need to cast or ensure typescript picks it up. 
        // For this test we assume the runtime has it.
        await (hookEngine as any).transition('A', 'B', {});

        expect(onLeaveSpy).toHaveBeenCalledTimes(1);
        expect(onTransitionSpy).toHaveBeenCalledTimes(1);
        expect(onEnterSpy).toHaveBeenCalledTimes(1);

        // Verify order: Leave A -> Transition -> Enter B
        expect(onLeaveSpy.mock.invocationCallOrder[0]).toBeLessThan(onTransitionSpy.mock.invocationCallOrder[0]);
        expect(onTransitionSpy.mock.invocationCallOrder[0]).toBeLessThan(onEnterSpy.mock.invocationCallOrder[0]);
    });
});
