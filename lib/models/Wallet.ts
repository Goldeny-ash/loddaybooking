import { Schema, model, models } from "mongoose";

const WalletSchema = new Schema(
  {
    walletId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    currency: {
      type: String,
      enum: ["KES", "USD", "EUR", "GBP", "GHS", "NGN", "UGX", "TZS", "XAF", "XOF"],
      required: true,
    },

    currentBalance: {
      type: Number,
      default: 0,
    },

    availableBalance: {
      type: Number,
      default: 0,
    },

    intasendCurrentBalance: {
      type: Number,
      default: 0,
    },

    intasendAvailableBalance: {
      type: Number,
      default: 0,
    },

    intasendLastSync: {
      type: Date,
      default: null,
    },

    isClearing: {
      type: Boolean,
      default: false,
    },

    canDisburse: {
      type: Boolean,
      default: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

WalletSchema.index({ businessId: 1 });
WalletSchema.index({ walletId: 1 });

export default models.Wallet || model("Wallet", WalletSchema);
