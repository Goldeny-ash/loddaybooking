import { Schema, model, models, Types } from "mongoose";

const WalletTransactionSchema = new Schema(
  {
    // 🔗 Core Relationships
    walletId: {
      type: String,
      required: true,
      index: true,
    },

    businessId: {
      type: Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    bookingId: {
      type: Types.ObjectId,
      ref: "Booking",
      index: true,
    },

  

    // 🧾 Transaction Classification
    type: {
      type: String,
      enum: [
        "DEPOSIT",            // STK Push funding
        "WITHDRAWAL_MPESA",   // B2C
        "WITHDRAWAL_BANK",    // Bank payout
        "WITHDRAWAL_B2B",     // Paybill/Till
        "REFUND",             // Chargeback
        "P2P_REWARD",         // Admin reward
        "INTERNAL_TRANSFER",  // Wallet to wallet
        "BOOKING_HOLD",       // Held until completion
        "BOOKING_RELEASE",    // Released to available
        "ADJUSTMENT",         // Manual admin adjustment
      ],
      required: true,
      index: true,
    },

    direction: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
      index: true,
    },

    // 💰 Financials
    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      enum: ["KES", "USD", "EUR", "GBP", "GHS", "NGN", "UGX", "TZS", "XAF", "XOF"],
      required: true,
      default: "KES",
    },

    fee: {
      type: Number,
      default: 0,
    },

    netAmount: {
      type: Number,
      required: true,
    },

    // 📊 Balance Snapshots (CRITICAL FOR AUDIT)
    previousBalance: {
      type: Number,
      required: true,
    },

    newBalance: {
      type: Number,
      required: true,
    },

    previousAvailableBalance: {
      type: Number,
      required: true,
    },

    newAvailableBalance: {
      type: Number,
      required: true,
    },

    // 🔎 External References (IntaSend)
    invoiceId: {
      type: String,
      index: true,
    },

    trackingId: {
      type: String,
      index: true,
    },

    chargebackId: {
      type: String,
      index: true,
    },

    payoutBatchId: {
      type: String,
      index: true,
    },

    externalReference: {
      type: String,
      index: true,
    },

    // 📄 Description
    narrative: {
      type: String,
    },

    // 📡 Status Tracking
    status: {
      type: String,
      enum: [
        "PENDING",
        "PROCESSING",
        "REQUIRES_APPROVAL",
        "SUCCESS",
        "FAILED",
        "CANCELLED",
        "REVERSED",
      ],
      default: "PENDING",
      index: true,
    },

    failureReason: {
      type: String,
    },

    // 🔐 Metadata
    initiatedBy: {
      type: String,
      enum: ["SYSTEM", "BUSINESS", "ADMIN"],
      default: "SYSTEM",
    },

    ipAddress: String,

    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

//
// 🔎 Compound Indexes (Performance & Reconciliation)
//

WalletTransactionSchema.index({ walletId: 1, createdAt: -1 });
WalletTransactionSchema.index({ businessId: 1, createdAt: -1 });
WalletTransactionSchema.index({ type: 1, status: 1 });

export default models.WalletTransaction ||
  model("WalletTransaction", WalletTransactionSchema);
