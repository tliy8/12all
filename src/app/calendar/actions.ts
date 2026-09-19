'use server';

import { db } from '@/lib/database';

export async function getScheduledPostsForMonthAction(year: number, month: number) {
  try {
    // Calculate the start and end of the month
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

    const { data, error } = await db.from('posts')
      .select(`
        id,
        master_title,
        master_text,
        media_urls,
        scheduled_for,
        publish_jobs (
          platform,
          status
        )
      `)
      .gte('scheduled_for', startDate)
      .lte('scheduled_for', endDate);

    if (error) {
      console.error('Error fetching calendar posts:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Action error:', error);
    return { success: false, error: error.message };
  }
}
