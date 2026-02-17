import AuditLog from "@/lib/models/AuditLog";

export async function logAction({
  businessId,
  userId,
  action,
  targetType,
  targetId,
  status = "SUCCESS",
  details = {},
}: {
  businessId: string;
  userId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  status?: string;
  details?: any;
}) {
  try {
    await AuditLog.create({
      businessId,
      userId,
      action,
      targetType,
      targetId,
      status,
      details,
    });
  } catch (err) {
    console.error("Failed to log action", err);
  }
}
