'use server';

import { db } from '@/lib/database';
import { revalidatePath } from 'next/cache';

export async function getQueueJobsAction() {
  try {
    const { data, error } = await db.from('publish_jobs')
      .select(`
        id,
        platform,
        status,
        error_log,
        attempt_count,
        updated_at,
        created_at,
        posts (
          id,
          master_title,
          scheduled_for
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching queue jobs:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Action error:', error);
    return { success: false, error: error.message };
  }
}

export async function cancelJobAction(jobId: string) {
  try {
    const traceId = crypto.randomUUID();
    // To cancel a job, we can simply delete it from the queue or set status to CANCELLED.
    // Given the current status types, let's delete it so it's fully cancelled.
    // If we want a soft cancel, we could add CANCELLED status, but for now DELETE is safest.
    const { error } = await db.delete('publish_jobs', { id: jobId }, traceId);
    
    if (error) throw error;

    revalidatePath('/queue');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
