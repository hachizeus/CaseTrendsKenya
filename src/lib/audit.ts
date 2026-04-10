import { supabase } from "@/integrations/supabase/client";

export interface AuditLogPayload {
  actor_id?: string | null;
  actor_email?: string | null;
  user_id?: string | null;
  action_type: string;
  entity: string;
  entity_id?: string | null;
  details?: Record<string, unknown> | null;
}

export async function logAuditAction(payload: AuditLogPayload) {
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: payload.actor_id ?? null,
    actor_email: payload.actor_email ?? null,
    user_id: payload.user_id ?? null,
    action_type: payload.action_type,
    entity: payload.entity,
    entity_id: payload.entity_id ?? null,
    details: payload.details ?? null,
  });

  if (error) {
    console.warn("Failed to write audit log:", error.message);
  }
}
