
import { describe, it, expect, vi } from 'vitest';
import { UepaPayClient } from '../src/client/client';
import { UepaPayConfig } from '../src/client/types';

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('UepaPayClient', () => {
    const config: UepaPayConfig = {
        merchantId: 'TEST_MERCHANT',
        merchantName: 'Test Store',
        merchantIp: '127.0.0.1',
        authKey: 'TEST_KEY',
        primaryKey: 'TEST_PRIMARY',
        environment: 'staging'
    };

    it('should generate a payment URL successfully', async () => {
        const client = new UepaPayClient(config);

        // Mock EncryptRequest response
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                Result: true,
                Message: 'Success',
                Example: 'ENCRYPTED_STRING_123'
            })
        });

        const url = await client.generatePaymentUrl({
            id: 'ORD-001',
            amount: 100.50,
            currency: 'DOP',
            description: 'Test Order'
        });

        expect(url).toContain('https://staging.uepapay.com/pl_external.aspx');
        expect(url).toContain('d=ENCRYPTED_STRING_123');
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/EncryptRequest'),
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('TEST_MERCHANT')
            })
        );
    });

    it('should validate an order successfully', async () => {
        const client = new UepaPayClient(config);

        // Mock CheckOrder response
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                Result: true,
                Message: 'Approved',
                PaymentStatus: 'Paid',
                AuthorizationCode: 'AUTH-123'
            })
        });

        const result = await client.validateOrder('ORD-001');

        expect(result.status).toBe('PAID');
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/CheckOrder'),
            expect.any(Object)
        );
    });
});
