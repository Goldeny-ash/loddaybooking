import { Schema, model, models } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    // Multi-tenant scope
    businessId: {
      type: String,
      required: true,
      index: true,
    },

    /*
     * IntaSend identifiers
     */
    subscriptionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    planId: {
      type: String,
      required: true,
      index: true,
    },

    customerId: {
      type: String,
      required: true,
      index: true,
    },

    externalReference: {
      type: String,
      index: true,
    },

    /*
     * Billing configuration snapshot
     * (Store snapshot so plan changes later don’t break history)
     */
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

    billingCycles: {
      type: Number, // null = autorenew
      default: null,
    },

    /*
     * Lifecycle State
     */
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "CANCELED", "EXPIRED", "FAILED"],
      default: "PENDING",
      index: true,
    },

    /*
     * Payment Flow
     */
    setupUrl: String,

    /*
     * Time Tracking
     */
    startsAt: Date,
    expiresAt: Date,

    lastChargeAt: Date,
    nextChargeAt: Date,

    /*
     * Provider metadata
     */
    providerCreatedAt: Date,
    providerUpdatedAt: Date,
  },
  { timestamps: true }
);

/*
 * Ensure one active subscription per business
 * (Prevents duplicate billing)
 */
SubscriptionSchema.index(
  { businessId: 1, status: 1 },
  { partialFilterExpression: { status: "ACTIVE" } }
);

export default models.Subscription ||
  model("Subscription", SubscriptionSchema);
