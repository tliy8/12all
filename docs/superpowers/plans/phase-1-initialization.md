# Plan: Phase 1 - Project Initialization & Environment Setup

This plan follows the Superpowers (obra) methodology.
**Executor Persona:** Gifted engineer with no context and poor judgment.

## Context
We are starting the "Personal Omnichannel Publishing Platform" project. The goal of this task is to get a working Next.js 15 environment and a local Supabase instance running.

## Decisions
- **Node.js:** v22.x (LTS)
- **Package Manager:** `pnpm`
- **Structure:** `src/` directory, App Router, TypeScript, Tailwind CSS, ESLint.

## Tasks

### 1. Environment Verification
- **Goal:** Ensure the system is ready for development.
- **Files:** N/A
- **Action:** Check versions of node, pnpm, and docker.
- **Verification:** `node -v` (>=20), `pnpm -v` (>=9), `docker -v`.

### 2. Next.js 15 Initialization
- **Goal:** Scaffold the base application.
- **Files:** Root directory.
- **Action:** Run `pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm`.
- **Verification:** Check if `package.json` and `src/app` exist.

### 3. Engine & Script Configuration
- **Goal:** Lock in versions and add essential scripts.
- **Files:** `package.json`
- **Action:** Add `"engines": { "node": ">=22.0.0" }` and ensuring `pnpm-lock.yaml` is generated.
- **Verification:** `pnpm install`.

### 4. Supabase Local Initialization
- **Goal:** Set up the local database environment.
- **Files:** `supabase/`
- **Action:** Run `supabase init`.
- **Verification:** Check if `supabase/config.toml` exists.

### 5. Project Directory Structure
- **Goal:** Create folders for the upcoming phases.
- **Files:** `src/`
- **Action:** Create `src/lib`, `src/services`, `src/hooks`, `src/components/ui`.
- **Verification:** `ls -R src/`.

### 6. Initial Smoke Test
- **Goal:** Confirm the dev server starts.
- **Files:** N/A
- **Action:** Run `pnpm dev`.
- **Verification:** Access `http://localhost:3000` and confirm the Next.js welcome page.
