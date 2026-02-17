// ---------------- Booking Mongoose Model ----------------
import { Schema, model, models } from "mongoose";

const BookingSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },

    services: [
      {
        serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
        durationMinutes: { type: Number, required: true },
        price: { type: Number, required: true },
        selectedReferenceImages: [
          { referenceId: { type: Schema.Types.ObjectId, ref: "ReferenceImage" }, imageIndex: Number },
        ],
        selectedAddOns: [
          {
            title: String,
            durationMinutes: Number,
            price: Number,
          },
        ],
        selectedSessions: [
          {
            sessions: Number,
            durationMinutes: Number,
            price: Number,
          },
        ],
        selectedAreas: [
          {
            area: String,
            min: Number,
            max: Number,
            price: Number,
          },
        ],
        selectedTier: {
          label: String,
          min: Number,
          max: Number,
          price: Number,
        },
        promotions: [
          {
            title: String,
            type: String,
            value: Number,
          },
        ],
      },
    ],

    date: { type: String, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    totalDurationMinutes: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    calloutFee: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },

    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: String,
    note: String,

    isMobile: { type: Boolean, default: false },
    customerLocation: { address: String, lat: Number, lng: Number },
    distanceKm: Number,
    customerReferenceImages: [
  {
    url: { type: String, required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    imageIndex: Number,
  },
],
promoCode: String,

    status: {
      type: String,
      enum: ["pending", "pendingDeposit", "confirmed", "cancelled", "rescheduled", "refunded", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: String,

    depositAmount: { type: Number, default: 0 },
    depositId: { type: Schema.Types.ObjectId, ref: "Deposit" },
    depositPaidOut: { type: Boolean, default: false },
    depositRefunded: { type: Boolean, default: false },

    manageToken: { type: String, required: true, index: true },
    bookingKey: { type: String, required: true },
    rescheduleCount: { type: Number, default: 0 },

    completedBy: { type: Schema.Types.ObjectId, ref: "Staff" },
    completedAt: Date,
    source: { type: String, default: "public_link" },
  },
  { timestamps: true }
);

// Indexes
BookingSchema.index({ businessId: 1, date: 1, status: 1 });
BookingSchema.index({ bookingKey: 1 }, { unique: true });

export default models.Booking || model("Booking", BookingSchema);
