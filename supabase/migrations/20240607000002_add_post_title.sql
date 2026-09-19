-- Add master_title to posts table
ALTER TABLE posts ADD COLUMN master_title TEXT;

-- Update audit_logs payload logic for clarity (optional, but good for consistency)
COMMENT ON COLUMN posts.master_title IS 'Primary headline for platforms like Douyin/Xiaohongshu';
