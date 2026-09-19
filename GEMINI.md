# Project Instructions: Personal Omnichannel Publishing Platform

This document serves as the absolute source of truth for all AI agents and developers working on this project. Adherence to these standards is mandatory to ensure consistency, reliability, and industry-grade quality.

## 1. Core Architecture & Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS.
- **Backend:** Next.js Server Actions and Route Handlers.
- **Database:** Supabase (PostgreSQL) with Row-Level Security (RLS).
- **Queue System:** PostgreSQL-based job queue (logic-driven, no external Redis).
- **Automation:** Playwright (Node.js) for Tier B browser automation.
- **Hosting:** Railway.app (Local-first development).

## 2. Programming Principles & Style

### 2.1 Code Quality
- **Type Safety:** Strict TypeScript usage. No `any`. Use interfaces/types for all data structures, especially API responses and database rows.
- **Component Pattern:** Prefer Small, Functional Components. Use Server Components by default; only use `'use client'` when interactivity is required.
- **Clean Code:** Use descriptive variable names (e.g., `isProcessingJob` instead of `loading`). Follow the DRY (Don't Repeat Yourself) principle.
- **Error Handling:** Use `try/catch` blocks in all Server Actions and Route Handlers. Log errors to the `audit_logs` table with appropriate severity.

### 2.2 Database & State
- **Schema First:** Always refer to `spec.md` before creating or modifying tables.
- **Traceability:** Every mutation (Create/Update/Delete) MUST generate an `audit_log` entry with a `trace_id`.
- **Atomic Operations:** Use Postgres transactions for operations affecting multiple tables (e.g., creating a Post and its associated Publish Jobs).

### 2.3 Security Mandates
- **Encryption:** NEVER store raw OAuth tokens or session cookies. Use the centralized `EncryptionService` (AES-256-GCM) for all `auth_payload` data.
- **Environment Variables:** All secrets (Supabase Keys, Encryption Keys, API Secrets) MUST be accessed via `process.env`. Never hardcode keys.
- **Admin Only:** All routes except the Login page MUST be protected by Supabase Auth middleware.

## 3. The Superpowers (obra) Framework

All work on this project MUST strictly follow the **Superpowers** methodology (Jesse Vincent/obra). This is not optional. Discipline is our primary constraint.

### 3.1 The 7-Stage Workflow
1.  **Socratic Brainstorming:** Begin every complex request by asking clarifying questions. Aim to understand the "Why" and "Edge Cases" before the "How."
2.  **Git Worktree Isolation:** Create a dedicated branch for every task. Never work on the main branch directly.
3.  **Writing-Plans (The Core Superpower):**
    *   Draft a detailed implementation plan before any coding.
    *   Write for a **"Gifted engineer with no context and poor judgment."**
    *   Break tasks into **2–5 minute chunks**.
    *   Specify exact file paths and include inline code snippets for clarity.
    *   Include a **Verification Step** (executable test/command) for every task.
    *   Save the plan as a permanent artifact in `docs/superpowers/plans/`.
4.  **Subagent-Driven Development:** Delegate tasks to specialized subagents (via `invoke_agent`) to ensure zero context leakage and fresh perspectives.
5.  **Test-Driven Development (TDD):** The **Iron Law**. Write a failing test first. Code written without a failing test is considered a bug. If you can't test it, you can't build it.
6.  **Two-Stage Code Review:**
    *   **Stage 1:** Verify compliance with the `writing-plans` spec.
    *   **Stage 2:** Verify idiomatic quality, type safety, and engineering standards.
7.  **Branch Completion:** Merge to the development branch, delete the worktree, and document the completion.

### 3.2 Strategic Orchestration
- **Mandatory Planning:** Any task involving >3 files or complex logic MUST use `enter_plan_mode` to execute the `writing-plans` skill.
- **Deep Research:** Use `grep_search` and `web_fetch` to validate all assumptions before implementation.
- **Exhaustive Validation:** Run `tsc`, linting, and verify that `audit_logs` are firing for every mutation.

### 3.3 Implementation Rules
- **Surgical Edits:** Use `replace` for targeted changes.
- **Self-Correction:** Analyze failures, adjust, and retry autonomously.
- **Traceability:** Every mutation MUST be linked to a `trace_id` in the `audit_logs`.

---
*By following these Superpowers, we ensure this project is built to the highest possible industry standard.*

## 4. Specific Operational Patterns

### 4.1 Audit Logging Pattern
```typescript
async function performAction(data: any, userId: string) {
  const traceId = crypto.randomUUID();
  try {
    // 1. Log Start
    await logAudit({ action: 'ACTION_START', traceId, severity: 'INFO', ... });
    
    // 2. Perform Logic
    const result = await db.execute(data);
    
    // 3. Log Success
    await logAudit({ action: 'ACTION_SUCCESS', traceId, severity: 'INFO', entity_id: result.id, ... });
    return result;
  } catch (error) {
    // 4. Log Failure
    await logAudit({ action: 'ACTION_ERROR', traceId, severity: 'ERROR', payload: { error: error.message } });
    throw error;
  }
}
```

### 4.2 Playwright Stealth Pattern
- Always use the `stealth` plugin/evasion techniques for Tier B platforms.
- Reuse `storageState` to minimize login triggers.
- Implement random delays between actions to simulate human behavior.

---
*Note: This file is a living document. Update it as new patterns or constraints emerge.*