# System Design Specification: Personal Omnichannel Publishing Platform

## 1. Overview & Objective
A centralized, highly modular platform designed for personal use to publish content (text, images, and video) simultaneously across multiple social media networks. The system is optimized for an AI-native development workflow (e.g., using Cursor for code generation and maintenance), with decoupled components and asynchronous background processing. The application is strictly single-user (admin only) focusing on reliability over scale.

## 2. Architectural Stack

| Component | Technology | Rationale for AI-Native & Personal Use |
| :--- | :--- | :--- |
| **Frontend UI** | Next.js 15 (App Router) + Tailwind CSS | Fast development, server actions, and serves as the API backend. |
| **Mobile Strategy** | Progressive Web App (PWA) | Bypasses App Store deployment. Installs directly to the phone home screen via mobile browser. |
| **Backend & DB** | Supabase (PostgreSQL) | Handles Authentication, File Storage, and Database in one unified free tier. |
| **Queue System** | PostgreSQL-based Queue | Utilizes the existing Supabase Postgres DB to manage background jobs, keeping the stack minimal without adding external services like Redis. |
| **Hosting** | Railway.app | Docker-native, always-on hosting. Runs the Next.js app and long-running background worker processes without serverless timeouts. |
| **Automation** | Playwright | Runs headless browsers in the Railway container to automate uploads to restricted platforms. |

## 3. Integration & Stability Matrix

The integration strategy is split into two distinct tiers based on platform API availability and restrictions.

### 3.1 Tier A: Official APIs (Stable, OAuth 2.0)
These platforms utilize official REST/Graph APIs. The architecture dictates using isolated Next.js Route Handlers for each platform's OAuth flow to prevent monolithic authentication failures.

* **Meta (Facebook & Instagram)**
    * *Constraint:* The Instagram API strictly requires a Professional account linked to a Facebook Page.
    * *Stability Protocol:* The backend will exchange short-lived User Tokens for a **Page Access Token**. Generated under Admin privileges, Page Access Tokens do not expire, ensuring zero-maintenance stability.
    * *App Review Bypass:* The Meta Developer App will remain permanently in "Development Mode" with target accounts added as manual "Testers."
* **Google Business Profile (GBP)**
    * *Constraint:* Google aggressively rejects generic or personal project API applications.
    * *Stability Protocol:* The API application will be submitted using the registered details, verified profile, and web domain of the existing industrial hardware and timber business. Positioning the tool as an internal B2B operational utility secures enterprise-grade approval.
* **X (Twitter)**
    * *Constraint:* Operates on a pay-per-use model.
    * *Stability Protocol:* Requires pre-loaded credits in the developer portal. Costs: plain text/media ~$0.015, URLs ~$0.20 per request.
* **LinkedIn**
    * *Stability Protocol:* Offers a straightforward, stable OAuth 2.0 flow.

### 3.2 Tier B: Walled Gardens (Brittle, Browser Automation)
* **Platforms:** Xiaohongshu, Douyin, TikTok.
* *Constraint:* No official API access is available without an enterprise MCN license, and API Sandbox modes restrict content to private visibility.
* *Stability Protocol:* The backend will utilize Playwright running inside a Dockerized container on Railway to simulate user login (via serialized session cookies) and uploads.
* *Maintenance Reality:* The frontend DOM structures of these platforms change frequently. CSS selectors in the Playwright scripts will require periodic manual updates when UI elements are altered. The AI-native workflow (e.g., Cursor) will be heavily utilized here to quickly patch selector changes based on visual or DOM diffs.

## 4. Security & Data Management

* **Encryption:** Application-Level Encryption. OAuth tokens and Playwright session cookies are encrypted and decrypted within the Node.js backend using a master symmetric key stored securely in Railway environment variables. The raw values are never exposed in the database or frontend.
* **Authentication:** Supabase Auth is used to secure the PWA. Registration is disabled; only the pre-configured admin user can access the platform.
* **Content Generation:** All text content is manually authored by the user; AI is not used for generating or translating post content.

## 5. Database Schema (Supabase PostgreSQL)

### Table: `platform_credentials`
*Purpose: Stores encrypted OAuth tokens for official APIs and serialized session cookies for Playwright.*
* `id` (uuid, primary key)
* `platform_name` (string) - e.g., 'facebook', 'xiaohongshu', 'douyin'
* `auth_payload` (text) - **Encrypted** string containing the access token or Playwright session state. Handled securely by Node.js AES-256-GCM encryption service.
* `metadata` (jsonb) - Stores non-sensitive IDs (like `facebook_page_id`) and UI metadata (like account name or profile picture).
* `is_active` (boolean) - Toggles platform availability.
* `updated_at` (timestamp)

**Expected Action Behaviors:**
*   **Toggle Status (UI Switch)**: Updates `is_active = true | false`. When false, the platform is paused and the background worker will skip publishing to it.
*   **Disconnect (Trash Icon)**: Hard deletes the row (`DELETE FROM platform_credentials WHERE id = ?`), permanently revoking access and wiping encrypted tokens.
*   **Reconnect**: Triggers the OAuth flow or Playwright session refresh route. Upon successful authorization, performs an `UPSERT` to overwrite the existing encrypted `auth_payload` and resets `is_active = true`.

### Table: `posts`
*Purpose: The master draft and media reference.*
* `id` (uuid, primary key)
* `master_title` (text, nullable) - Primary headline (crucial for Douyin/Xiaohongshu).
* `master_text` (text) - Primary universal caption.
* `media_urls` (text array) - Links to images/videos stored securely in Supabase Storage.
* `scheduled_for` (timestamp, nullable) - Future posting capability.
* `created_at` (timestamp)

### Table: `publish_jobs`
*Purpose: The execution queue handled by the PostgreSQL worker.*
* `id` (uuid, primary key)
* `post_id` (uuid, foreign key -> `posts.id`)
* `platform` (string) - Target destination.
* `status` (enum) - `PENDING`, `IN_PROGRESS`, `SUCCESS`, `FAILED`.
* `metadata` (jsonb, nullable) - Stores platform-specific job data (e.g., `ig_container_id`, `twitter_media_id`).
* `error_log` (text, nullable) - Captures failure reasons.
* `published_url` (text, nullable) - Live link to the successful post.
* `attempt_count` (integer) - Default 0.
* `locked_at` (timestamp, nullable) - Prevents multiple workers from picking up the same job.
* `trace_id` (uuid) - Unique ID shared with `audit_logs` to correlate worker events with original user actions.
* `updated_at` (timestamp)

### Table: `oauth_states`
*Purpose: Transient storage for securing OAuth 2.0 flows (State/PKCE).*
* `id` (uuid, primary key)
* `platform` (string)
* `state` (text)
* `code_verifier` (text, nullable)
* `expires_at` (timestamp) - Cleanup required after 10-15 minutes.

### Table: `audit_logs`
*Purpose: A multi-layered trace of all platform, API, and worker events.*
* `id` (uuid, primary key)
* `user_id` (uuid, foreign key -> `auth.users`, nullable) - System/Worker actions may not have a user.
* `trace_id` (uuid) - Links related logs across different layers of a single operation (e.g., Post -> Job -> Worker).
* `severity` (enum) - `INFO`, `WARNING`, `ERROR`, `CRITICAL`.
* `action` (string) - E.g., 'OAUTH_START', 'POST_QUEUED', 'WORKER_BROWSER_LAUNCH', 'API_RESPONSE_ERROR'.
* `entity_type` (string) - E.g., 'posts', 'credentials', 'system', 'worker'.
* `entity_id` (uuid, nullable)
* `payload` (jsonb) - Input parameters, request summaries, or scrubbed error details.
* `ip_address` (text, nullable)
* `created_at` (timestamp)

### Table: `system_health`
*Purpose: Real-time monitoring of background worker liveness.*
* `id` (uuid, primary key)
* `component` (string) - E.g., 'publish_worker_primary', 'heartbeat_monitor'.
* `last_heartbeat` (timestamp)
* `status` (string) - E.g., 'ACTIVE', 'STALLED', 'MEMORY_HIGH'.
* `metadata` (jsonb) - Current system metrics (e.g., CPU, Memory, active browser count).

## 6. Next Implementation Phases

### Phase 1: Local Foundation & Environment
*   **Scaffold Next.js 15 App:** Initialize the project with TypeScript and Tailwind CSS.
*   **Local Supabase Setup:** Configure a local Supabase environment (using Docker/CLI) to match the production schema.
*   **Auth Configuration:** Set up local Admin login and secure route protection.
*   **Encryption Utility:** Develop and unit test the local AES-256 encryption service for credentials.

### Phase 2: Local Database & Storage
*   **Schema Migration:** Apply the verified schema (Posts, Jobs, Logs, Health) to the local database.
*   **Local Storage:** Configure local buckets for media uploads to simulate Supabase Storage.
*   **Audit Engine:** Implement the backend utility to automatically record `audit_logs` for all actions.

### Phase 3: Core PWA Frontend (Local)
*   **Post Creator:** Build the UI for universal captioning and multi-media uploads.
*   **Job Dashboard:** Create the real-time status monitor for `publish_jobs`.
*   **Mobile PWA:** Configure manifest and service workers for local mobile testing.

### Phase 4: Local Platform Integration (Tier A & B)
*   **OAuth Tunnels:** Use tools like `ngrok` or `localtunnel` to test official API callbacks (Tier A) on the local machine.
*   **Playwright Development:** Build and debug the automation scripts (Tier B) in "Headed" mode locally for Xiaohongshu, Douyin, and TikTok.
*   **Background Worker:** Run the PostgreSQL-based queue worker as a local Node.js process.

### Phase 5: Cloud Migration & Deployment
*   **Supabase Cloud:** Provision the production Supabase instance and sync the schema.
*   **Railway Deployment:** Containerize the application and worker with Playwright dependencies and deploy to Railway.
*   **Production Handover:** Final verification of production environment variables and permanent OAuth redirects.