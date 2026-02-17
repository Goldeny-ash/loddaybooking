import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    businessId: { type: String, required: true, index: true },
    userId: { type: String }, // optional: Clerk user who triggered
    action: { type: String, required: true }, // e.g., BOOKING_CREATED, SUBSCRIPTION_SUCCESS
    targetType: { type: String }, // e.g., Booking, Subscription
    targetId: { type: String }, // document ID
    status: { type: String }, // e.g., SUCCESS, FAILED
    details: { type: mongoose.Schema.Types.Mixed }, // any JSON details
  },
  { timestamps: true }
);

export default mongoose.models.AuditLog ||
  mongoose.model("AuditLog", AuditLogSchema);
