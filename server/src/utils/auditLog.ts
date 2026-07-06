import { prisma } from '../config';

interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ip?: string;
  userAgent?: string;
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        before: entry.before ? JSON.parse(JSON.stringify(entry.before)) : null,
        after: entry.after ? JSON.parse(JSON.stringify(entry.after)) : null,
        ip: entry.ip ?? null,
        userAgent: entry.userAgent ?? null,
      },
    });
  } catch (error) {
    // Audit logging should never break the main flow
    console.error('Failed to write audit log:', error);
  }
}
