import { Schema, model, models } from "mongoose";

const DepositSchema = new Schema(
  {
    // ----------------------------------
    // RELATIONS
    // ----------------------------------

    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },

    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    // ----------------------------------
    // PAYMENT IDENTIFIERS
    // ----------------------------------

    externalReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // 🔥 THIS IS THE MAIN TRACKING FIELD
    invoiceId: {
      type: String,
     
      unique: true,
      index: true,
    },

    // IntaSend internal invoice ID
    providerInvoiceId: {
      type: String,
      index: true,
    },

    // ----------------------------------
    // PAYMENT DETAILS
    // ----------------------------------

    phoneNumber: {
      type: String,
      required: true,
    },

    currency: {
      type: String,
      default: "KES",
      enum: ["KES", "USD", "EUR", "GBP"],
    },

    grossAmount: {
      type: Number,
      
    },

    feeAmount: {
      type: Number,
      default: 0,
    },

    netAmount: {
      type: Number,
      default: 0,
    },

    // ----------------------------------
    // STATUS TRACKING
    // ----------------------------------

    status: {
      type: String,
      enum: [
        "PENDING",
        "PROCESSING",
        "PAID",
        "FAILED",
        "CANCELLED",
        "REFUNDED",
      ],
      default: "PENDING",
      index: true,
    },

    providerState: {
      type: String, // e.g COMPLETE, SUCCESS, FAILED
    },

    // ----------------------------------
    // RECEIPTS & PROVIDER DATA
    // ----------------------------------

    mpesaReceipt: {
      type: String,
    },

    provider: {
      type: String,
      default: "M-PESA",
    },

    // Full raw IntaSend response snapshot
    rawResponse: {
      type: Schema.Types.Mixed,
    },

    // ----------------------------------
    // IDEMPOTENCY & LEDGER SAFETY
    // ----------------------------------

    walletCredited: {
      type: Boolean,
      default: false,
      index: true,
    },

    walletTransactionId: {
      type: Schema.Types.ObjectId,
      ref: "WalletTransaction",
    },

    // ----------------------------------
    // REFUND SUPPORT
    // ----------------------------------

    refundedAmount: {
      type: Number,
      default: 0,
    },

    refundInvoiceId: {
      type: String,
    },

    refundReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// ----------------------------------
// INDEXES FOR PERFORMANCE
// ----------------------------------

DepositSchema.index({ bookingId: 1 });
DepositSchema.index({ businessId: 1 });
DepositSchema.index({ invoiceId: 1 });
DepositSchema.index({ externalReference: 1 });
DepositSchema.index({ status: 1 });
DepositSchema.index({ walletCredited: 1 });

export default models.Deposit || model("Deposit", DepositSchema);
