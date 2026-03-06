import { Schema, model, models } from "mongoose";

const AffiliateCommissionSchema = new Schema(
  {
    affiliateId: {
      type: Schema.Types.ObjectId,
      ref: "Affiliate",
      required: true,
      index: true,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "KES" },
    type: { type: String, enum: ["FIRST", "RENEWAL"], required: true },
    status: {
      type: String,
      enum: ["PENDING", "PAID"],
      default: "PENDING",
      index: true,
    },
    paidOutAt: Date,
  },
  { timestamps: true }
);

export default models.AffiliateCommission ||
  model("AffiliateCommission", AffiliateCommissionSchema);
