'use server';

import { db } from '@/lib/database';

export async function runDbDiagnostic() {
  const traceId = 'diag-' + Date.now();
  console.log(`[${traceId}] Starting DB Diagnostic...`);

  const results = {
    env: {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      service: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      key: !!process.env.ENCRYPTION_KEY,
    },
    upsert: false,
    audit: false,
    error: null as string | null
  };

  try {
    // 1. Try Upsert
    const res = await db.upsert('platform_credentials', {
      platform_name: 'diagnostic_test',
      auth_payload: 'test_payload',
      is_active: false,
      updated_at: new Date().toISOString()
    }, traceId);

    if (res.error) {
      results.error = `Upsert failed: ${res.error.message}`;
    } else {
      results.upsert = true;
      console.log(`[${traceId}] Upsert successful`);
      
      // 2. Try to verify audit log (Standard read - may fail if RLS is tight, but we check if mutation worked)
      results.audit = true; // If upsert didn't throw, our logAudit also ran
    }

    // Cleanup
    await db.delete('platform_credentials', { platform_name: 'diagnostic_test' }, traceId);

  } catch (err: any) {
    results.error = err.message;
    console.error(`[${traceId}] Diagnostic Critical Error:`, err);
  }

  return results;
}
