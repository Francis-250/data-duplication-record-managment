import prisma from "@/lib/prisma";

export type AuditActionType =
  | "USER_LOGIN"
  | "RECORD_SUBMISSION"
  | "DATASET_IMPORT"
  | "DATA_VALIDATION"
  | "DEDUPLICATION_EXECUTION"
  | "MATCH_CONFIRMATION"
  | "MATCH_REJECTION"
  | "RECORD_MERGING"
  | "USER_MANAGEMENT"
  | "PERMISSION_CHANGES"
  | "SYSTEM_SETTING_CHANGES";

export interface LogAuditParams {
  actorUserId?: string | null;
  action: AuditActionType;
  entityType?: string;
  entityId?: string;
  description: string;
  previousData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function recordDeduplicationAudit(params: LogAuditParams) {
  try {
    return await prisma.deduplicationAuditLog.create({
      data: {
        actorUserId: params.actorUserId || null,
        action: params.action,
        entityType: params.entityType || null,
        entityId: params.entityId || null,
        description: params.description,
        previousData: params.previousData ? JSON.parse(JSON.stringify(params.previousData)) : undefined,
        newData: params.newData ? JSON.parse(JSON.stringify(params.newData)) : undefined,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    console.error("[Audit Log Error]:", error);
    return null;
  }
}
