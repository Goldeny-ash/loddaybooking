import { Schema, model, models } from "mongoose";

const RefundSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },

    depositId: { type: Schema.Types.ObjectId, ref: "Deposit" },

    amount: { type: Number, required: true },
    phoneNumber: { type: String, required: true },

    status: {
      type: String,
      enum: ["REQUESTED", "APPROVED", "SENT", "PAID", "FAILED"],
      default: "REQUESTED",
      index: true,
    },

    externalReference: { type: String, unique: true, sparse: true },

    payheroCheckoutId: String,
    payheroConversationId: String,
    mpesaReceipt: String,

    approvedBy: String,
    approvedAt: Date,
    sentAt: Date,
    paidAt: Date,
    failedAt: Date,
    failureReason: String,
  },
  { timestamps: true }
);

RefundSchema.index({ bookingId: 1 }, { unique: true }); // prevents double refund per booking

export default models.Refund || model("Refund", RefundSchema);
