import { Schema, model, models } from "mongoose";

const RefundSchema = new Schema(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,          // hard guarantee
      index: true,
    },

    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    depositId: {
      type: Schema.Types.ObjectId,
      ref: "Deposit",
      required: true,
      index: true,
    },

    invoiceId: String,        // IntaSend invoice
    trackingId: String,       // IntaSend payout tracking id

    amount: { type: Number, required: true },
    phoneNumber: { type: String, required: true },

    status: {
      type: String,
      enum: ["REQUESTED", "APPROVED", "SENT", "PAID", "FAILED"],
      default: "REQUESTED",
      index: true,
    },

    failureReason: String,

    approvedBy: String,
    approvedAt: Date,
    sentAt: Date,
    paidAt: Date,
    failedAt: Date,
  },
  { timestamps: true }
);

export default models.Refund || model("Refund", RefundSchema);
