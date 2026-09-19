import { supabase, getAdminClient } from './supabase';
import { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';

export type LogSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface AuditLogParams {
  action: string;
  entityType: string;
  entityId?: string;
  payload?: any;
  severity?: LogSeverity;
  traceId: string;
}

/**
 * Logs an action to the audit_logs table using admin client to bypass RLS.
 */
export async function logAudit(params: AuditLogParams) {
  return getAdminClient().from('audit_logs').insert({
    trace_id: params.traceId,
    severity: params.severity || 'INFO',
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    payload: params.payload || {},
  });
}

/**
 * Traceable Database Service
 * Enforces traceId and audit logging for all mutations.
 */
export const db = {
  // Querying
  from: (table: string) => getAdminClient().from(table),

  // Mutations
  insert: async (table: string, values: any, traceId: string) => {
    const res = await getAdminClient().from(table).insert(values).select().single();
    if (res.data) {
      await logAudit({
        action: `INSERT_${table.toUpperCase()}`,
        entityType: table,
        entityId: (res.data as any).id,
        payload: values,
        traceId,
      });
    } else if (res.error) {
      console.error(`[${traceId}] Insert Error:`, res.error);
    }
    return res;
  },

  update: async (table: string, values: any, match: any, traceId: string) => {
    const res = await getAdminClient().from(table).update(values).match(match).select();
    if (res.data) {
      await logAudit({
        action: `UPDATE_${table.toUpperCase()}`,
        entityType: table,
        entityId: (res.data as any)[0]?.id,
        payload: { values, match },
        traceId,
      });
    } else if (res.error) {
      console.error(`[${traceId}] Update Error:`, res.error);
    }
    return res;
  },

  delete: async (table: string, match: any, traceId: string) => {
    const res = await getAdminClient().from(table).delete().match(match).select();
    if (res.data) {
      await logAudit({
        action: `DELETE_${table.toUpperCase()}`,
        entityType: table,
        entityId: (res.data as any)[0]?.id,
        payload: { match },
        traceId,
      });
    } else if (res.error) {
      console.error(`[${traceId}] Delete Error:`, res.error);
    }
    return res;
  },

  upsert: async (table: string, values: any, traceId: string, onConflict?: string) => {
    const res = await getAdminClient().from(table).upsert(values, { onConflict }).select().single();
    if (res.data) {
      await logAudit({
        action: `UPSERT_${table.toUpperCase()}`,
        entityType: table,
        entityId: (res.data as any).id,
        payload: values,
        traceId,
      });
    } else if (res.error) {
      console.error(`[${traceId}] Upsert Error:`, res.error);
    }
    return res;
  }
};
