# Plan: Phase 3 - Core PWA Frontend (Local)

This plan follows the Superpowers (obra) methodology.
**Executor Persona:** Gifted engineer with no context and poor judgment.

## Context
We are building the user interface for the "Personal Omnichannel Publishing Platform". This includes the PWA setup, the post creation interface with media uploads, and the job status dashboard.

## Decisions
- **UI:** shadcn/ui (Radix UI + Tailwind).
- **PWA:** `@ducanh2912/next-pwa`.
- **Uploads:** Client-side direct to Supabase Storage.
- **State:** React State + Server Actions for DB mutations.

## Tasks

### 1. PWA Setup
- **Goal:** Enable mobile "Install to Home Screen" capability.
- **Files:** `next.config.ts`, `public/manifest.json`, `public/icons/*`
- **Action:** Install `@ducanh2912/next-pwa`. Configure `next.config.ts`. Generate a basic manifest.
- **Verification:** Chrome DevTools -> Application -> Manifest (Status: OK).

### 2. shadcn/ui Initialization
- **Goal:** Set up the component library foundation.
- **Files:** `components.json`, `src/app/globals.css`
- **Action:** Run `pnpm dlx shadcn-ui@latest init`. Install Button, Input, Textarea, Card, and Toast components.
- **Verification:** Successfully render a shadcn Button on the home page.

### 3. Storage Bucket Configuration
- **Goal:** Create the 'media' bucket in Supabase.
- **Files:** N/A
- **Action:** Use Supabase CLI or Studio to create a public 'media' bucket. Add RLS policy for authenticated uploads.
- **Verification:** Confirm bucket exists in Studio.

### 4. Post Creation Interface
- **Goal:** UI to draft posts and upload media.
- **Files:** `src/app/posts/new/page.tsx`, `src/components/media-uploader.tsx`
- **Action:** Build a form with `master_text` (textarea) and a multi-file uploader. Implement client-side upload to Supabase Storage.
- **Verification:** Upload an image and see its URL in the console.

### 5. Status Dashboard
- **Goal:** Monitor publishing jobs and system health.
- **Files:** `src/app/dashboard/page.tsx`
- **Action:** Create a list view for `publish_jobs` with status badges (Pending, Success, Failed). Add a small "System Health" indicator.
- **Verification:** View the dashboard and see empty state or test data.

### 6. Integration: Draft to Job
- **Goal:** Saving a post creates a job record with audit logs.
- **Files:** `src/app/posts/actions.ts`
- **Action:** Create a Server Action `createPostAction` that uses the `db.insert` wrapper (TraceableDb) to create a Post and linked Publish Jobs.
- **Verification:** Create a post via UI and check `audit_logs` in Supabase Studio.
