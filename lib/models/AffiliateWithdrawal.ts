import { Schema, model, models } from "mongoose";

const AffiliateWithdrawalSchema = new Schema(
  {
    affiliateId: {
      type: Schema.Types.ObjectId,
      ref: "Affiliate",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    phoneNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ["REQUESTED", "APPROVED", "REJECTED", "DISBURSED"],
      default: "REQUESTED",
      index: true,
    },
    approvedAt: Date,
    disbursedAt: Date,
    disbursementReference: String,
    note: String,
  },
  { timestamps: true }
);

export default models.AffiliateWithdrawal ||
  model("AffiliateWithdrawal", AffiliateWithdrawalSchema);
