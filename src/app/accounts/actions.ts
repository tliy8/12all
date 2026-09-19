'use server'

import { db } from '@/lib/database';
import { revalidatePath } from 'next/cache';

export async function disconnectAccount(id: string) {
  try {
    const { error } = await db
      .from('platform_credentials')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to disconnect account:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/accounts');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' };
  }
}

export async function toggleAccountStatus(id: string, isActive: boolean) {
  try {
    const { error } = await db
      .from('platform_credentials')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Failed to toggle account status:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/accounts');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' };
  }
}
