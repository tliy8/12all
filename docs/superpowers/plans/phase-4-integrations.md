# Plan: Phase 4 - Local Platform Integration (Tier B First)

This plan follows the Superpowers (obra) methodology.
**Executor Persona:** Gifted engineer with no context and poor judgment.

## Context
We are integrating social media platforms. We decided to start with **Tier B (Playwright)** for Douyin, Xiaohongshu, and TikTok to enable "Install to Home Screen" testing early. We also selected **ngrok** for Tier A (Meta/X) tunneling.

## Decisions
- **First Platforms:** Douyin, Xiaohongshu, TikTok (Tier B).
- **Session Strategy:** "In-App Login" where we launch a local headed browser, let the user log in, and capture `storageState`.
- **Tunneling:** `ngrok` for official API callbacks.

## Tasks

### 1. Integration Service Foundation
- **Goal:** Create a base class/interface for publishing.
- **Files:** `src/services/publish-service.ts`, `src/services/types.ts`
- **Action:** Define `BasePublisher` interface with `publish()` and `validateCredentials()` methods.
- **Verification:** Interface compiles.

### 2. Playwright Session Capture UI
- **Goal:** Admin UI to trigger headed browser for login.
- **Files:** `src/app/admin/platforms/page.tsx`, `src/app/admin/platforms/actions.ts`
- **Action:** Build a dashboard to manage platform statuses. Add "Connect" buttons that trigger a server action to launch Playwright locally.
- **Verification:** Clicking "Connect Douyin" opens a Chromium window.

### 3. Tier B: Douyin Publisher (Local)
- **Goal:** Automate video/image upload to Douyin Creator Studio.
- **Files:** `src/services/douyin-publisher.ts`
- **Action:** Implement `publish` logic: Load `storageState`, navigate to creator platform, fill Title/Caption, upload media, click publish.
- **Verification:** Run script locally and see a successful "Draft" or "Post" on Douyin.

### 4. Tier B: Xiaohongshu & TikTok Publishers
- **Goal:** Similar to Douyin, but for XHS and TikTok web.
- **Files:** `src/services/xhs-publisher.ts`, `src/services/tiktok-publisher.ts`
- **Action:** Port the automation logic to these platforms' specific DOM structures.
- **Verification:** Manual verification of successful uploads.

### 5. ngrok Setup & Tier A Preparation
- **Goal:** Prepare local machine for Meta/X callbacks.
- **Files:** `docs/guides/ngrok-setup.md`
- **Action:** Create a guide for the user to install ngrok and get a static domain. Update `.env.local` with the tunnel URL.
- **Verification:** `ngrok http 3000` works and is reachable externally.

### 6. Background Worker (Local)
- **Goal:** Poll `publish_jobs` and execute publishers.
- **Files:** `src/worker/processor.ts`, `package.json`
- **Action:** Create a local Node script that polls the DB every 30s. Use `TraceableDb` to update job status.
- **Verification:** Create a post via UI and see the worker pick it up and launch Playwright.
