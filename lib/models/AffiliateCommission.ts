import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const affiliateCommissionSchema = new Schema(
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
      default: null,
      index: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      trim: true,
      default: "KES",
    },
    type: {
      type: String,
      enum: ["FIRST", "RENEWAL"],
      required: true,
    },
    withdrawnAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    earnedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    availableAt: {
      type: Date,
      required: true,
      default: () => {
        const next = new Date();
        next.setDate(next.getDate() + 7);
        return next;
      },
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "AVAILABLE", "WITHDRAWN"],
      default: "PENDING",
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

affiliateCommissionSchema.index({ affiliateId: 1, status: 1, availableAt: 1 });

export type AffiliateCommissionDocument = InferSchemaType<typeof affiliateCommissionSchema> & {
  _id: mongoose.Types.ObjectId;
};

const AffiliateCommission =
  (mongoose.models.AffiliateCommission as Model<AffiliateCommissionDocument>) ||
  mongoose.model<AffiliateCommissionDocument>("AffiliateCommission", affiliateCommissionSchema);

export default AffiliateCommission;
