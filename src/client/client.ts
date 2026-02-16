
import { UepaPayConfig, UepaPayOrder } from './types';
import { UepaRemoteSecurity } from './security';


// Standard Payment States
export const PaymentStatus = {
    CREATED: 'CREATED',
    PENDING: 'PENDING',
    PAID: 'PAID',
    DECLINED: 'DECLINED',
    CANCELLED: 'CANCELLED',
    ERROR: 'ERROR'
};

export class UepaPayClient {
    private security: UepaRemoteSecurity;

    constructor(private config: UepaPayConfig) {
        this.security = new UepaRemoteSecurity(config);
    }

    /**
     * Generates the payment URL for the given order.
     * This involves 1) Constructing payload, 2) Encrypting via API, 3) Building URL.
     */
    public async generatePaymentUrl(order: UepaPayOrder): Promise<string> {
        const payload = {
            MerchantId: this.config.merchantId,
            MerchantName: this.config.merchantName,
            MerchantIp: this.config.merchantIp,
            MerchantTicket: order.id,
            Amount: order.amount.toFixed(2),
            CurrencyCode: order.currency === 'USD' ? '840' : '214',
            AuthKey: this.config.authKey,
            Description: order.description
        };

        const encryptedData = await this.security.encrypt(payload);

        const checkoutBase = this.config.environment === 'production'
            ? 'https://www.uepapay.com/pl_external.aspx'
            : 'https://staging.uepapay.com/pl_external.aspx';

        return `${checkoutBase}?d=${encodeURIComponent(encryptedData)}`;
    }

    /**
     * Validates an order status by calling CheckOrder.
     * Useful for webhooks or verifying a redirect return.
     */
    public async validateOrder(orderId: string): Promise<{ status: string; details: any }> {
        try {
            const result = await this.security.checkOrder(orderId);

            // Map UepaPay status to our simplified enum
            let status = PaymentStatus.PENDING;

            if (result.Result && result.Message === 'Approved') {
                status = PaymentStatus.PAID;
            } else if (result.Message === 'Declined') {
                status = PaymentStatus.DECLINED;
            } else if (result.Message === 'Cancelled') {
                status = PaymentStatus.CANCELLED;
            } else {
                // Fallback or specific error handling
                status = PaymentStatus.ERROR;
            }

            return { status, details: result };
        } catch (error) {
            return { status: PaymentStatus.ERROR, details: error };
        }
    }

    /**
     * Helper to handle incoming webhook/redirect data.
     * Currently just a wrapper around validateOrder since UepaPay verification relies on CheckOrder.
     */
    public async handleWebhook(orderId: string): Promise<{ status: string; details: any }> {
        return this.validateOrder(orderId);
    }
}

