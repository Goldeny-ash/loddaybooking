import { Schema, model, models } from "mongoose";

const AffiliateSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    idDocumentUrl: { type: String, required: true },
    idDocumentName: { type: String, required: true },
    idDocumentMimeType: { type: String, required: true },
    idDocumentData: { type: String, required: true, select: false },
    accessCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      default: null,
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      default: null,
    },
    approvedAt: Date,
    rejectedAt: Date,
    performanceReviewDueAt: Date,
    lastSuccessfulReferralAt: Date,

    totalEarned: { type: Number, default: 0 },
    availableBalance: { type: Number, default: 0 },
    paidOutTotal: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "PAUSED"],
      default: "PENDING",
      index: true,
    },
  },
  { timestamps: true }
);

export default models.Affiliate || model("Affiliate", AffiliateSchema);
