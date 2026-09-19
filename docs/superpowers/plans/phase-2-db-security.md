# Plan: Phase 2 - Local Database & Security Service

This plan follows the Superpowers (obra) methodology.
**Executor Persona:** Gifted engineer with no context and poor judgment.

## Context
We are implementing the data layer and security utilities for the "Personal Omnichannel Publishing Platform". This includes the encryption service for credentials and the forced-trace database service.

## Decisions
- **Encryption:** AES-256-GCM with a single master key (`ENCRYPTION_KEY`).
- **Traceability:** A `TraceableDbService` wrapper that enforces a `traceId` for all mutations.
- **Database:** Local Supabase (Postgres) migrations.

## Tasks

### 1. Environment & Environment Variables
- **Goal:** Set up the local secrets.
- **Files:** `.env.local`, `.env.example`
- **Action:** Add `ENCRYPTION_KEY` (32 bytes hex) and Supabase local URL/Key.
- **Verification:** Ensure `EncryptionService` can read the key.

### 2. Encryption Service Implementation (TDD)
- **Goal:** Robust AES-256-GCM encryption/decryption.
- **Files:** `src/lib/encryption.ts`, `src/lib/__tests__/encryption.test.ts`
- **Action:** Implement `encrypt(text, key)` and `decrypt(data, key)`. Include IV and Auth Tag.
- **Verification:** Run `vitest` (need to install) to confirm round-trip encryption works.

### 3. Database Schema Migration
- **Goal:** Apply the schema from `spec.md`.
- **Files:** `supabase/migrations/20240607000000_initial_schema.sql`
- **Action:** Create tables: `platform_credentials`, `posts`, `publish_jobs`, `oauth_states`, `audit_logs`, `system_health`. Add RLS.
- **Verification:** Run `pnpm exec supabase db reset` and check table existence via `supabase db list`.

### 4. Traceable Database Service
- **Goal:** Enforce audit logs on every mutation.
- **Files:** `src/lib/database.ts`
- **Action:** Create a wrapper for the Supabase client that requires a `traceId` for `insert`, `update`, and `delete`. The wrapper must automatically call `logAudit` inside a transaction or sequential call.
- **Verification:** Unit test that a call to `db.insert('posts', { ... }, traceId)` results in both a post and an audit log entry.

### 5. Dependency Installation
- **Goal:** Add tools for testing and encryption.
- **Files:** `package.json`
- **Action:** Install `vitest` and `@supabase/supabase-js`.
- **Verification:** `pnpm install`.

### 6. Final Validation
- **Goal:** Ensure the layer is solid.
- **Files:** N/A
- **Action:** Run all tests and linting.
- **Verification:** `pnpm vitest run` and `pnpm lint`.
