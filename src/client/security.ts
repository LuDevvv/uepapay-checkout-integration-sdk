
import { UepaPayConfig, EncryptRequestPayload, EncryptRequestResponse, CheckOrderPayload, CheckOrderResponse } from './types';
import { UepaPayError } from '../errors/uepapay-error';

/**
 * Handles communication with the UepaPay Configuration Service.
 * Implements encryption and validation via remote API calls.
 */
export class UepaRemoteSecurity {
    private baseUrl: string;

    constructor(private config: UepaPayConfig) {
        if (config.endpointUrl) {
            this.baseUrl = config.endpointUrl;
        } else {
            this.baseUrl = config.environment === 'production'
                ? 'https://www.uepapay.com/ConfigurationService.svc'
                : 'https://staging.uepapay.com/ConfigurationService.svc';
        }
    }

    /**
     * Calls EncryptRequest to secure the payload.
     */
    public async encrypt(payload: EncryptRequestPayload): Promise<string> {
        const url = `${this.baseUrl}/EncryptRequest`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 10000);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new UepaPayError(`UepaPay EncryptRequest failed: ${response.statusText}`, 'ENCRYPT_REQUEST_FAILED');
            }

            const data = await response.json() as EncryptRequestResponse;
            if (!data.Result) {
                throw new UepaPayError(`UepaPay Encryption Error: ${data.Message}`, 'ENCRYPTION_ERROR');
            }

            return data.Example;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new UepaPayError('Request timed out', 'TIMEOUT');
            }
            throw error;
        }
    }

    /**
     * Calls CheckOrder to validate the transaction status.
     */
    public async checkOrder(orderId: string): Promise<CheckOrderResponse> {
        const url = `${this.baseUrl}/CheckOrder`;

        const payload: CheckOrderPayload = {
            MerchantId: this.config.merchantId,
            AuthKey: this.config.authKey,
            MerchantTicket: orderId
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 10000);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new UepaPayError(`UepaPay CheckOrder failed: ${response.statusText}`, 'CHECK_ORDER_FAILED');
            }

            const data = await response.json() as CheckOrderResponse;

            // Return full answer for client interpretation (e.g. Declined vs Error)
            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new UepaPayError('Request timed out', 'TIMEOUT');
            }
            throw error;
        }
    }
}
