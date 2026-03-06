import { Schema, model, models, Types } from "mongoose";

const PayoutSchema = new Schema(
  {
    businessId: {
      type: Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    bookingIds: [
      {
        type: Types.ObjectId,
        ref: "Booking",
        required: true,
      },
    ],

    depositIds: [
      {
        type: Types.ObjectId,
        ref: "Deposit",
        required: true,
      },
    ],

    walletId: {
      type: String,
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "KES",
    },

    method: {
      type: String,
      enum: ["MPESA", "BANK", "B2B"],
      default: "MPESA",
    },

    destinationAccount: {
      type: String,
      index: true,
    },

    trackingId: {
      type: String,
      index: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "SUCCESS", "FAILED", "CANCELLED", "REVERSED"],
      default: "PENDING",
      index: true,
    },

    providerState: {
      type: String,
      index: true,
    },

    walletTransactionId: {
      type: Types.ObjectId,
      ref: "WalletTransaction",
      index: true,
    },

    failureReason: String,

    lastStatusCheckAt: Date,

    initiatedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: Date,
    reversedAt: Date,
  },
  { timestamps: true }
);
export default models.Payout || model("Payout", PayoutSchema);
