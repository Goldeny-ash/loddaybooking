import { Schema, model, models } from "mongoose";

const SubscriptionTransactionSchema = new Schema(
  {
    businessId: {
      type: String,
      required: true,
      index: true,
    },

    subscriptionId: {
      type: String,
      required: true,
      index: true,
    },

    providerTransactionId: {
      type: String,
      unique: true,
      index: true,
    },

    grossAmount: {
      type: Number,
      required: true,
    },

    providerFee: {
      type: Number,
      default: 0,
    },

    netAmount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      enum: ["KES", "USD", "EUR", "GBP"],
    },

    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "REFUNDED"],
      required: true,
    },

    paymentMethod: String,

    chargedAt: Date,
  },
  { timestamps: true }
);

export const SubscriptionTransaction =
  models.SubscriptionTransaction ||
  model("SubscriptionTransaction", SubscriptionTransactionSchema);
