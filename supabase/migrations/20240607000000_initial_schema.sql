-- 1. Enums
CREATE TYPE job_status AS ENUM ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED');
CREATE TYPE log_severity AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- 2. Tables

-- platform_credentials
CREATE TABLE platform_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name TEXT NOT NULL UNIQUE,
  auth_payload TEXT NOT NULL, -- Encrypted
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_text TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- publish_jobs
CREATE TABLE publish_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  status job_status DEFAULT 'PENDING',
  metadata JSONB DEFAULT '{}',
  error_log TEXT,
  published_url TEXT,
  attempt_count INTEGER DEFAULT 0,
  locked_at TIMESTAMP WITH TIME ZONE,
  trace_id UUID NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- oauth_states
CREATE TABLE oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  state TEXT NOT NULL,
  code_verifier TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- audit_logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  trace_id UUID NOT NULL,
  severity log_severity DEFAULT 'INFO',
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  payload JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- system_health
CREATE TABLE system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component TEXT NOT NULL UNIQUE,
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'
);

-- 3. Functions & Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_platform_credentials_updated_at BEFORE UPDATE ON platform_credentials FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_publish_jobs_updated_at BEFORE UPDATE ON publish_jobs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 4. RLS (Row Level Security) - Admin Only
-- Since this is a personal tool, we simplify by allowing the authenticated user (you) full access.
ALTER TABLE platform_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admin full access" ON platform_credentials FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON posts FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON publish_jobs FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON oauth_states FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON audit_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON system_health FOR ALL TO authenticated USING (true);
