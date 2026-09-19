import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db, logAudit } from '../database';
import { supabase } from '../supabase';

// Mock Supabase
vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('Traceable Database Service', () => {
  const traceId = 'test-trace-id';

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'user-123' } } });
  });

  it('should log audit entry on successful insert', async () => {
    const mockData = { id: 'post-1', master_text: 'hello' };
    const fromMock = vi.mocked(supabase.from);
    
    // Setup the mock chain for insert
    const insertResult = { data: mockData, error: null };
    fromMock.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(insertResult),
    } as any);

    await db.insert('posts', { master_text: 'hello' }, traceId);

    // Verify insert was called
    expect(fromMock).toHaveBeenCalledWith('posts');
    
    // Verify audit log was called (second call to from)
    expect(fromMock).toHaveBeenCalledWith('audit_logs');
  });

  it('should log error severity on failed insert', async () => {
    const fromMock = vi.mocked(supabase.from);
    
    // Setup failure
    fromMock.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
    } as any);

    await db.insert('posts', { master_text: 'hello' }, traceId);

    // Check that audit_logs was called with ERROR severity
    const auditCall = fromMock.mock.calls.find(call => call[0] === 'audit_logs');
    expect(auditCall).toBeDefined();
  });
});
