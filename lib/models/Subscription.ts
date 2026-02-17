import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema(
  {
    businessId: {
      type: String,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "EXPIRED"],
      default: "PENDING",
    },

    amount: {
      type: Number,
      required: true,
    },

    externalReference: {
      type: String,
      unique: true,
    },

    invoiceId: String,
    apiRef: String,

    startsAt: Date,
    expiresAt: Date,
  },
  { timestamps: true }
);

export default mongoose.models.Subscription ||
  mongoose.model("Subscription", SubscriptionSchema);
