import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for general use (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Client for administrative actions (bypasses RLS)
 * ONLY use this in Server Actions or Background Workers.
 * Initialized lazily to prevent client-side crashes.
 */
export const getAdminClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Admin client cannot be used in the browser');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};
