'use server';

import { db } from '@/lib/database';
import { encrypt } from '@/lib/encryption';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export async function saveFacebookTokenAction(token: string) {
  const traceId = crypto.randomUUID();

  try {
    if (!token || typeof token !== 'string') {
      return { success: false, error: 'Invalid token format.' };
    }

    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      console.error(`[${traceId}] Missing ENCRYPTION_KEY in environment variables.`);
      return { success: false, error: 'System misconfiguration: Encryption key missing.' };
    }

    // Encrypt the raw access token
    const encryptedPayload = await encrypt(token, encryptionKey);

    // Upsert into platform_credentials
    const result = await db.upsert(
      'platform_credentials',
      {
        platform_name: 'facebook',
        auth_payload: encryptedPayload,
        is_active: true,
        updated_at: new Date().toISOString()
      },
      traceId,
      'platform_name'
    );

    if (result.error) {
      throw new Error(result.error.message);
    }

    revalidatePath('/');
    revalidatePath('/settings');
    
    return { success: true };
  } catch (error: any) {
    console.error(`[${traceId}] Failed to save Facebook token:`, error);
    return { success: false, error: error.message || 'Unknown error occurred.' };
  }
}
