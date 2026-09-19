import * as dotenv from 'dotenv';
import path from 'path';

// 1. Load Environment Variables immediately
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// 2. Validate essential vars are present
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('CRITICAL: NEXT_PUBLIC_SUPABASE_URL is missing in .env.local');
  process.exit(1);
}

// 3. Dynamically import and start the worker to ensure Env Vars are ready
async function bootstrap() {
  console.log('--- Bootstrap: Environment Loaded ---');
  try {
    const { startWorker } = await import('./processor-core');
    await startWorker();
  } catch (err) {
    console.error('Failed to bootstrap worker:', err);
    process.exit(1);
  }
}

bootstrap();
