# one2o 🚀

**one2o** is a premium, self-hosted omnichannel publishing platform designed to orchestrate and automate content delivery across multiple social networks from a single, unified dashboard. 

Built with modern web technologies, it features an intelligent queueing system, secure credential management, and supports both official API integrations (like Meta Graph API) and Tier B browser automation (via Playwright).

## 🏗️ Architecture & Frameworks

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with dynamic dark mode and glassmorphism UI.
- **Components:** Shadcn UI, Radix Primitives, and Lucide Icons for a premium aesthetic.
- **State Management:** React Server Components (RSC) and Server Actions.

### Backend & Database
- **Database:** Supabase (PostgreSQL)
- **Security:** Row-Level Security (RLS) is enforced. All platform credentials (like OAuth or Page Access Tokens) are encrypted in the database using **AES-256-GCM** before storage.
- **Background Worker:** A custom, logic-driven Node.js worker (`processor-core.ts`) polls the database queue to process publishing jobs asynchronously, ensuring no posts are lost during network failures.

### APIs & Publishers
- **Facebook:** Utilizes the official **Meta Graph API (v19.0)** for instant, direct-to-server publishing using Permanent Page Access Tokens.
- **Tier-B Platforms (Rednote, Douyin, TikTok):** Utilizes headless browser automation via **Playwright** (`playwright-stealth`) to interact with platforms that lack open developer APIs.

## 🗄️ Database Schema

The platform relies on a normalized PostgreSQL database. Key tables include:
- `posts`: Stores the master text, media URLs, and scheduled publishing times.
- `publish_jobs`: The central nervous system for the queue. Links a `post_id` to a specific `platform`, tracking its state (`PENDING`, `IN_PROGRESS`, `SUCCESS`, `FAILED`), retry attempts, and error logs.
- `platform_credentials`: Securely stores the `AES-256-GCM` encrypted `auth_payload` for connected social platforms.
- `audit_logs`: Maintains a traceable history of all database mutations for security and debugging.
- `system_health`: Tracks the heartbeat and status of the background queue worker.

## 🚀 Getting Started

### Prerequisites
- Node.js (v22.12.0 or higher)
- A Supabase Project (for PostgreSQL)
- An `ENCRYPTION_KEY` (A 64-character hex string for AES-256-GCM)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/one2o.git
   cd one2o
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup your environment variables in `.env`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ENCRYPTION_KEY=your_64_character_hex_key
   ```

### Running Locally
Because `one2o` uses a decoupled architecture for reliability, you need to run two separate processes in your local environment.

**Terminal 1: Start the Web Dashboard**
```bash
npm run dev
```

**Terminal 2: Start the Background Queue Worker**
```bash
npm run worker
```

## 🛡️ Security

This project employs strict security mandates:
- **No raw tokens:** Tokens are never stored in plain text.
- **Traceability:** Every job execution and database mutation is tied to a unique `trace_id`.
- **Environment Isolation:** Keys are strictly accessed via `process.env`.
