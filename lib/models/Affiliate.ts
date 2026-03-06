import { Schema, model, models } from "mongoose";

const AffiliateSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, index: true },
    accessCode: { type: String, required: true, unique: true, index: true },
    referralCode: { type: String, required: true, unique: true, index: true },
    codeExpiresAt: { type: Date, required: true },

    totalEarned: { type: Number, default: 0 },
    availableBalance: { type: Number, default: 0 },
    paidOutTotal: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      index: true,
    },
  },
  { timestamps: true }
);

export default models.Affiliate || model("Affiliate", AffiliateSchema);
