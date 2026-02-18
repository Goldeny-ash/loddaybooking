import { Schema, model, models } from "mongoose";

const SubscriptionPlanSchema = new Schema(
  {
    businessId: {
      type: String,
      required: true,
      index: true,
    },

    // IntaSend
    planId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
    },

    currency: {
      type: String,
      enum: ["KES", "USD", "EUR", "GBP"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    frequency: {
      type: Number,
      required: true,
    },

    frequencyUnit: {
      type: String,
      enum: ["D", "W", "M", "Y"],
      required: true,
    },
isActive: {
  type: Boolean,
  default: true,
},

    billingCycles: {
      type: Number, // null = autorenew
      default: null,
    },

    providerCreatedAt: Date,
    providerUpdatedAt: Date,
  },
  { timestamps: true }
);

export const SubscriptionPlan =
  models.SubscriptionPlan ||
  model("SubscriptionPlan", SubscriptionPlanSchema);
