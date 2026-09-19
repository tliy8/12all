import { db } from './src/lib/database';

async function run() {
  console.log('Starting upsert test...');
  const res = await db.upsert('platform_credentials', {
    platform_name: 'rednote',
    auth_payload: 'test_payload_2',
    is_active: true,
    updated_at: new Date().toISOString()
  }, 'test-trace', 'platform_name');
  
  console.log('Result:', JSON.stringify(res, null, 2));
}

run().catch(console.error);
