
export interface UepaPayConfig {
    merchantId: string;
    merchantName: string;
    merchantIp: string;
    authKey: string;
    primaryKey: string; // Used for "Public Token" or similar
    environment: 'staging' | 'production';
    /** Optional override for the ConfigurationService URL */
    endpointUrl?: string;
    /** Request timeout in ms (default: 10000) */
    timeout?: number;
}

export interface UepaPayOrder {
    id: string;
    description: string;
    amount: number;
    currency: 'DOP' | 'USD';
    tax?: number;
}

/**
 * Payload sent to EncryptRequest
 */
export interface EncryptRequestPayload {
    MerchantId: string;
    MerchantName: string;
    MerchantIp: string;
    MerchantTicket: string;
    Amount: string;
    CurrencyCode: string;
    AuthKey: string;
    Description: string;
    ExtraData?: string;
}

/**
 * Response from EncryptRequest
 */
export interface EncryptRequestResponse {
    Example: string; // The encrypted string is usually returned here
    Result: boolean;
    Message: string;
}

/**
 * Payload sent to CheckOrder (for validation)
 */
export interface CheckOrderPayload {
    MerchantId: string;
    AuthKey: string;
    MerchantTicket: string; // The order ID
}

/**
 * Response from CheckOrder
 */
export interface CheckOrderResponse {
    Result: boolean;
    Message: string; // "Approved", "Declined", etc.
    PaymentStatus: string; // "Paid", "Cancelled"
    AuthorizationCode?: string;
}
