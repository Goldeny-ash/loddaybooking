import { Schema, model, models } from "mongoose";

const AffiliateReferralUseSchema = new Schema(
  {
    affiliateId: {
      type: Schema.Types.ObjectId,
      ref: "Affiliate",
      required: true,
      index: true,
    },
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    referralCode: { type: String, required: true, index: true },
    usedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },

    firstSubscriptionCommissionPaid: { type: Boolean, default: false },
    renewalCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

AffiliateReferralUseSchema.index(
  { affiliateId: 1, businessId: 1, referralCode: 1 },
  { unique: true }
);

export default models.AffiliateReferralUse ||
  model("AffiliateReferralUse", AffiliateReferralUseSchema);
