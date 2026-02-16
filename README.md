
# UepaPay Checkout Integration SDK

[![npm version](https://img.shields.io/npm/v/uepapy-checkout-integration.svg)](https://www.npmjs.com/package/uepapy-checkout-integration)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight, type-safe SDK for integrating UepaPay (Dominican Republic Payment Gateway) into TypeScript applications. 
Designed for **Node.js**, **Cloudflare Workers**, and modern web frameworks.

## Features

- 🔒 **Secure Encryption**: Handles the `EncryptRequest` handshake transparently.
- ✅ **Order Validation**: Built-in support for `CheckOrder` to verify payment status.
- ⚙️ **Workflow Engine**: extensive state machine for managing payment styling (optional).
- 🦕 **Type-Safe**: Complete TypeScript definitions for all payloads.
- 🚀 **Zero Runtime Dependencies**: Uses native `fetch` and `crypto` APIs.

## Installation

```bash
npm install uepapy-checkout-integration
```

## Quick Start

### 1. Initialize Client

```typescript
import { UepaPayClient } from 'uepapy-checkout-integration';

const client = new UepaPayClient({
  merchantId: process.env.UEPA_MERCHANT_ID,
  merchantName: 'My Store',
  merchantIp: '127.0.0.1', // Your Server IP
  authKey: process.env.UEPA_AUTH_KEY,
  primaryKey: process.env.UEPA_PRIMARY_KEY,
  environment: 'staging' // or 'production'
});
```

### 2. Generate Payment Link

redirect the user to this URL to complete payment.

```typescript
const paymentUrl = await client.generatePaymentUrl({
  id: 'ORD-12345',
  amount: 1500.00,
  currency: 'DOP',
  description: 'Monthly Subscription',
  tax: 0 // Optional
});

// redirect(paymentUrl);
```

### 3. Handle Webhook / Validation

When the user returns or a webhook is triggered:

```typescript
const { status, details } = await client.validateOrder('ORD-12345');

if (status === 'PAID') {
  console.log('Payment successful!');
  // fulfillOrder('ORD-12345');
} else {
  console.warn('Payment failed or pending:', status);
}
```

## Advanced Usage

### Custom Workflow State Machine

The SDK includes a powerful state machine engine if you need to manage complex payment flows manually:

```typescript
import { createWorkflow } from 'uepapy-checkout-integration';

const engine = createWorkflow({
  name: 'PaymentProcess',
  initialState: 'CREATED',
  transitions: [
    { from: 'CREATED', to: 'PAID' }
  ]
});
```

## License

MIT © [LuDevvv](https://github.com/LuDevvv)
