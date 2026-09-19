import dotenv from 'dotenv';
import path from 'path';

// Load env vars BEFORE importing local files that depend on process.env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { db } from './src/lib/database';
import { encrypt } from './src/lib/encryption';

async function testDb() {
  const traceId = 'test-trace-' + Date.now();
  console.log('Testing DB connection with traceId:', traceId);
  
  try {
    const res = await db.upsert('platform_credentials', {
      platform_name: 'test_platform',
      auth_payload: 'encrypted_stuff',
      is_active: true,
      updated_at: new Date().toISOString()
    }, traceId);

    if (res.error) {
      console.error('Upsert failed:', res.error);
    } else {
      console.log('Upsert successful:', res.data);
    }

    const { data: logs } = await db.from('audit_logs').select('*').eq('trace_id', traceId);
    console.log('Audit logs found:', logs?.length || 0);

  } catch (err) {
    console.error('Critical Error:', err);
  }
}

testDb();
