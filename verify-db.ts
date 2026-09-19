import dotenv from 'dotenv';
import path from 'path';

// Load env vars BEFORE importing local files that depend on process.env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { db } from './src/lib/database';

async function verifyDb() {
  console.log('--- Verifying Database ---');
  
  // Check platform_credentials
  const { data: credentials, error: credError } = await db.from('platform_credentials').select('*');
  
  if (credError) {
    console.error('❌ Failed to fetch platform_credentials:', credError);
  } else {
    console.log(`✅ Fetched platform_credentials. Count: ${credentials?.length}`);
    if (credentials && credentials.length > 0) {
      console.log(JSON.stringify(credentials, null, 2));
    } else {
      console.log('Table is currently empty.');
    }
  }

  console.log('\n--- Checking audit_logs ---');
  // Check audit_logs
  const { data: logs, error: logError } = await db.from('audit_logs').select('*').limit(3);
  
  if (logError) {
    console.error('❌ Failed to fetch audit_logs:', logError);
  } else {
    console.log(`✅ Fetched audit_logs. Sample:`);
    console.log(JSON.stringify(logs, null, 2));
  }
}

verifyDb();
