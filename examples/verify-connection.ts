
import dotenv from 'dotenv';
import { UepaPayClient } from '../src/client/client';
import { UepaPayError } from '../src/errors/uepapay-error';

// Load .env from project root if available
dotenv.config();

/**
 * Script to verify connectivity and protocol (JSON support) with UepaPay.
 * 
 * Usage:
 * 1. Create a .env file with:
 *    UEPA_MERCHANT_ID=...
 *    UEPA_AUTH_KEY=...
 *    UEPA_ENVIRONMENT=staging
 * 
 * 2. Run: npx tsx examples/verify-connection.ts
 */
async function main() {
    console.log('🔍 Verifying UepaPay Connectivity...');

    const merchantId = process.env.UEPA_MERCHANT_ID;
    const authKey = process.env.UEPA_AUTH_KEY;
    const environment = (process.env.UEPA_ENVIRONMENT as 'staging' | 'production') || 'staging';

    if (!merchantId || !authKey) {
        console.error('❌ Missing credentials. Please set UEPA_MERCHANT_ID and UEPA_AUTH_KEY in .env');
        process.exit(1);
    }

    const client = new UepaPayClient({
        merchantId,
        merchantName: 'Connectivity Test',
        merchantIp: '127.0.0.1',
        authKey,
        primaryKey: 'DUMMY_PRIMARY', // Not used for EncryptRequest but required by type
        environment,
        timeout: 5000 // 5s timeout
    });

    try {
        console.log(`📡 Connecting to ${environment} environment...`);

        // Attempt to encrypt a dummy payload
        // If this succeeds, JSON protocol is supported.
        const url = await client.generatePaymentUrl({
            id: 'TEST-CONN-01',
            amount: 10.00,
            currency: 'DOP',
            description: 'Connectivity Check'
        });

        console.log('✅ Connection Successful!');
        console.log('📝 Generated URL:', url);
        console.log('ℹ️  If you see the URL above, UepaPay accepts JSON payloads.');

    } catch (error) {
        console.error('❌ Connection Failed');

        if (error instanceof UepaPayError) {
            console.error(`   Error Code: ${error.code}`);
            console.error(`   Message: ${error.message}`);
        } else {
            console.error('   Unknown Error:', error);
        }

        console.log('\n⚠️  Troubleshooting:');
        console.log('1. If status is 415 or 400, UepaPay might require XML/SOAP.');
        console.log('2. Check if your IP is whitelisted in UepaPay console.');
    }
}

main().catch(console.error);
