import { Schema, model, models } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    businessId: {
      type: String,
      required: true,
      index: true,
    },

    externalReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    invoiceId: { type: String, index: true },
    apiRef: { type: String, index: true },

    amount: { type: Number, required: true },
    currency: { type: String, default: "KES" },

    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "EXPIRED", "FAILED", "CANCELED"],
      default: "PENDING",
      index: true,
    },

    cycle: {
      type: String,
      enum: ["MONTHLY"],
      default: "MONTHLY",
    },
    cycleCount: { type: Number, default: 1 },
    paidAt: Date,
    expiresAt: Date,
    nextChargeAt: Date,

    isRenewal: { type: Boolean, default: false },
    phoneNumber: String,

    affiliateCode: String,
    affiliateId: { type: Schema.Types.ObjectId, ref: "Affiliate", index: true },
    affiliateDiscountApplied: { type: Boolean, default: false },
    affiliateCommissionAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SubscriptionSchema.index(
  { businessId: 1, status: 1 },
  { partialFilterExpression: { status: "ACTIVE" } }
);

export default models.Subscription || model("Subscription", SubscriptionSchema);
