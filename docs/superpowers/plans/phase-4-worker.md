# Plan: Phase 4.2 - Background Publishing Worker

This plan follows the Superpowers (obra) methodology.
**Executor Persona:** Gifted engineer with no context and poor judgment.

## Context
We have connected TikTok and established a database schema for jobs. Now we need a standalone process (worker) that:
1. Polls the database for `PENDING` jobs.
2. Downloads media associated with the post.
3. Uses Playwright to automate the publishing flow.
4. Updates the job status and audit logs.

## Decisions
- **Process:** Standalone Node.js script run via `tsx` (TypeScript executor).
- **Polling:** Intervals of 30 seconds.
- **Locking:** Uses the `locked_at` column to ensure only one worker instance handles a specific job.
- **Media Handling:** Downloads Supabase storage URLs to a local `temp/` folder.

## Tasks

### 1. Worker Entry Point & Polling Loop
- **Goal:** Create a reliable polling mechanism.
- **Files:** `src/worker/processor.ts`
- **Action:** 
    - Implement a `while(true)` loop with a 30s delay.
    - Query `publish_jobs` where `status = 'PENDING'` and `locked_at` is null.
    - Update the first job found: set `status = 'IN_PROGRESS'` and `locked_at = now()`.
- **Verification:** Start the script and see logs for "Polling for jobs...".

### 2. Media Downloader Utility
- **Goal:** Fetch files from Supabase Storage to local disk.
- **Files:** `src/worker/media-utils.ts`
- **Action:** Implement `downloadMedia(urls: string[]): Promise<string[]>` which saves files to a `.temp/` directory and returns absolute local paths.
- **Verification:** Run a small test script to download a known Supabase URL.

### 3. TikTok Publishing Script (Complete Logic)
- **Goal:** Fully automate the TikTok upload flow.
- **Files:** `src/services/tiktok-publisher.ts`
- **Action:** 
    - Navigate to `tiktok.com/upload`.
    - Upload the downloaded media file.
    - Fill in the `master_title` and `master_text`.
    - Click "Post".
    - Wait for success message.
- **Verification:** Manually trigger a TikTok job and watch the automation finish.

### 4. Douyin & Rednote Publishing Skeletons
- **Goal:** Implement the logic for other Tier B platforms.
- **Files:** `src/services/douyin-publisher.ts`, `src/services/rednote-publisher.ts`
- **Action:** Similar to TikTok, but with platform-specific selectors (found via local exploration).
- **Verification:** Successful "Draft" creation on these platforms.

### 5. Worker Registration
- **Goal:** Add easy command to start the worker.
- **Files:** `package.json`
- **Action:** Add `"scripts": { "worker": "tsx src/worker/processor.ts" }`.
- **Verification:** `pnpm worker` starts the process.

### 6. Health Heartbeat
- **Goal:** Update the `system_health` table.
- **Files:** `src/worker/processor.ts`
- **Action:** Every 60 seconds, upsert a row to `system_health` for 'publish_worker'.
- **Verification:** Check Dashboard UI to see the worker status as "ACTIVE".
