'use server';

import { db } from '@/lib/database';
import { revalidatePath } from 'next/cache';

export async function createPostAction(formData: FormData) {
  const masterTitle = formData.get('master_title') as string;
  const masterText = formData.get('master_text') as string;
  const mediaUrlsStr = formData.get('media_urls') as string;
  const mediaUrls = JSON.parse(mediaUrlsStr || '[]');
  const platformsStr = formData.get('platforms') as string;
  const platforms = JSON.parse(platformsStr || '[]');
  const overridesStr = formData.get('platform_overrides') as string;
  const platformOverrides = JSON.parse(overridesStr || '{}');
  const scheduledFor = formData.get('scheduled_for') as string | null;

  const traceId = crypto.randomUUID();

  try {
    // 1. Create the Master Post
    const postRes = await db.insert('posts', {
      master_title: masterTitle,
      master_text: masterText,
      media_urls: mediaUrls,
      scheduled_for: scheduledFor || null,
    }, traceId);

    if (postRes.error) throw new Error(postRes.error.message);

    const postId = postRes.data.id;

    // 2. Create Publish Jobs for each platform
    for (const platform of platforms) {
      await db.insert('publish_jobs', {
        post_id: postId,
        platform,
        status: 'PENDING',
        trace_id: traceId,
        metadata: platformOverrides[platform] || null,
      }, traceId);
    }

    revalidatePath('/dashboard');
    return { success: true, postId };
  } catch (error: any) {
    console.error('Failed to create post:', error);
    return { success: false, error: error.message };
  }
}

export async function retryPublishJobAction(jobId: string) {
  const traceId = crypto.randomUUID();
  try {
    const { error } = await db.update('publish_jobs', {
      status: 'PENDING',
      error_log: null,
      attempt_count: 0,
      updated_at: new Date().toISOString()
    }, { id: jobId }, traceId);

    if (error) throw error;

    revalidatePath('/dashboard');
    revalidatePath('/posts');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to retry job:', error);
    return { success: false, error: error.message };
  }
}

export async function deletePostAction(id: string) {
  try {
    const traceId = crypto.randomUUID();
    const result = await db.delete('posts', { id }, traceId);
    
    if (result.error) {
      return { success: false, error: result.error.message };
    }
    
    revalidatePath('/posts');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function duplicatePostAction(id: string) {
  try {
    const traceId = crypto.randomUUID();
    
    // Fetch original post
    const { data: original, error: fetchErr } = await db.from('posts').select('*').eq('id', id).single();
    if (fetchErr || !original) {
      return { success: false, error: fetchErr?.message || 'Post not found' };
    }

    // Prepare duplicate
    const { id: _id, created_at: _created, updated_at: _updated, ...postData } = original;
    postData.master_title = postData.master_title ? `${postData.master_title} (Copy)` : 'Untitled Post (Copy)';
    postData.scheduled_for = null;

    const result = await db.insert('posts', postData, traceId);
    
    if (result.error) {
      return { success: false, error: result.error.message };
    }

    revalidatePath('/posts');
    return { success: true, newPostId: result.data?.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPostAction(id: string) {
  try {
    const { data, error } = await db.from('posts').select(`
      *,
      publish_jobs(platform, metadata)
    `).eq('id', id).single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updatePostAction(id: string, formData: FormData) {
  const masterTitle = formData.get('master_title') as string;
  const masterText = formData.get('master_text') as string;
  const mediaUrlsStr = formData.get('media_urls') as string;
  const mediaUrls = JSON.parse(mediaUrlsStr || '[]');
  const platformsStr = formData.get('platforms') as string;
  const platforms = JSON.parse(platformsStr || '[]');
  const overridesStr = formData.get('platform_overrides') as string;
  const platformOverrides = JSON.parse(overridesStr || '{}');
  const scheduledFor = formData.get('scheduled_for') as string | null;

  const traceId = crypto.randomUUID();

  try {
    // 1. Update the Master Post
    const postRes = await db.update('posts', {
      master_title: masterTitle,
      master_text: masterText,
      media_urls: mediaUrls,
      scheduled_for: scheduledFor || null
    }, { id }, traceId);

    if (postRes.error) throw new Error(postRes.error.message);

    // 2. Update Publish Jobs
    await db.delete('publish_jobs', { post_id: id }, traceId);
    
    for (const platform of platforms) {
      await db.insert('publish_jobs', {
        post_id: id,
        platform,
        status: 'PENDING',
        trace_id: traceId,
        metadata: platformOverrides[platform] || null,
      }, traceId);
    }

    revalidatePath('/dashboard');
    revalidatePath('/posts');
    return { success: true, postId: id };
  } catch (error: any) {
    console.error('Failed to update post:', error);
    return { success: false, error: error.message };
  }
}

export async function schedulePostAction(id: string, datetime: string) {
  try {
    const traceId = crypto.randomUUID();
    const result = await db.update('posts', { scheduled_for: datetime }, { id }, traceId);
    if (result.error) throw result.error;
    
    revalidatePath('/posts');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function unschedulePostAction(id: string) {
  try {
    const traceId = crypto.randomUUID();
    const result = await db.update('posts', { scheduled_for: null }, { id }, traceId);
    if (result.error) throw result.error;
    
    revalidatePath('/posts');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function retryAllFailedJobsAction(postId: string) {
  try {
    const traceId = crypto.randomUUID();
    const { data: jobs, error: fetchErr } = await db.from('publish_jobs')
      .select('id')
      .eq('post_id', postId)
      .eq('status', 'FAILED');
      
    if (fetchErr) throw fetchErr;
    
    if (!jobs || jobs.length === 0) {
      return { success: false, error: 'No failed jobs found.' };
    }
    
    for (const job of jobs) {
      await db.update('publish_jobs', {
        status: 'PENDING',
        error_log: null,
        attempt_count: 0,
        updated_at: new Date().toISOString()
      }, { id: job.id }, traceId);
    }
    
    revalidatePath('/dashboard');
    revalidatePath('/posts');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
