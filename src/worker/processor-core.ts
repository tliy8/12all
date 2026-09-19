import { db } from '../lib/database';
import { downloadMedia, cleanupMedia } from './media-utils';
import { TikTokPublisher } from '../services/tiktok-publisher';
import { DouyinPublisher } from '../services/douyin-publisher';
import { RednotePublisher } from '../services/rednote-publisher';
import { FacebookPublisher } from '../services/facebook-publisher';
import { BasePublisher } from '../services/types';

const POLLING_INTERVAL = 30000; // 30 seconds
const HEARTBEAT_INTERVAL = 60000; // 60 seconds

const PUBLISHERS: Record<string, BasePublisher> = {
  'tiktok': new TikTokPublisher(),
  'douyin': new DouyinPublisher(),
  'rednote': new RednotePublisher(),
  'facebook': new FacebookPublisher(),
};

async function updateHeartbeat() {
  try {
    await db.upsert('system_health', {
      component: 'publish_worker',
      last_heartbeat: new Date().toISOString(),
      status: 'ACTIVE',
      metadata: { 
        node_version: process.version,
        active_platforms: Object.keys(PUBLISHERS)
      }
    }, 'system-worker-heartbeat', 'component');
  } catch (err) {
    console.error('Failed to update heartbeat:', err);
  }
}

async function processNextJob() {
  try {
    // 1. Find a pending, unlocked job
    const { data: job, error } = await db.from('publish_jobs')
      .select(`
        *,
        posts (*)
      `)
      .eq('status', 'PENDING')
      .is('locked_at', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error || !job) {
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching jobs:', error);
      }
      return;
    }

    console.log(`[${job.trace_id}] Found job for ${job.platform}. Locking...`);

    // 2. Lock the job
    const lockRes = await db.update('publish_jobs', {
      status: 'IN_PROGRESS',
      locked_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { id: job.id }, job.trace_id);

    if (lockRes.error) {
      console.error(`[${job.trace_id}] Failed to lock job:`, lockRes.error);
      return;
    }

    const post = job.posts as any;
    const publisher = PUBLISHERS[job.platform];

    if (!publisher) {
      throw new Error(`No publisher implemented for ${job.platform}`);
    }

    // 3. Download Media
    let localMedia: string[] = [];
    if (post.media_urls && post.media_urls.length > 0) {
      console.log(`[${job.trace_id}] Downloading media...`);
      localMedia = await downloadMedia(post.media_urls);
    }

    // 4. Publish
    console.log(`[${job.trace_id}] Executing ${job.platform} automation...`);
    const result = await publisher.publish({
      title: post.master_title,
      text: post.master_text,
      mediaUrls: localMedia,
      traceId: job.trace_id,
      music: post.master_metadata?.music,
      location: post.master_metadata?.location
    });

    // 5. Cleanup
    cleanupMedia(localMedia);

    // 6. Update Status
    if (result.success) {
      await db.update('publish_jobs', {
        status: 'SUCCESS',
        published_url: result.publishedUrl,
        locked_at: null,
        updated_at: new Date().toISOString()
      }, { id: job.id }, job.trace_id);
      console.log(`[${job.trace_id}] Job SUCCEEDED.`);
    } else {
      await db.update('publish_jobs', {
        status: 'FAILED',
        error_log: result.error,
        locked_at: null,
        updated_at: new Date().toISOString()
      }, { id: job.id }, job.trace_id);
      console.log(`[${job.trace_id}] Job FAILED: ${result.error}`);
    }

  } catch (err: any) {
    console.error('Critical Error in worker loop:', err.message);
  }
}

export async function startWorker() {
  console.log('--- Publishing Worker Started ---');
  console.log('Polling interval:', POLLING_INTERVAL / 1000, 's');

  // Initial heartbeat
  await updateHeartbeat();

  // Heartbeat loop
  setInterval(updateHeartbeat, HEARTBEAT_INTERVAL);

  // Main processing loop
  while (true) {
    console.log('Polling for jobs...');
    await processNextJob();
    await new Promise(r => setTimeout(r, POLLING_INTERVAL));
  }
}
