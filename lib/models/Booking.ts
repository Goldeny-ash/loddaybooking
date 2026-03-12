// ---------------- Booking Mongoose Model ----------------
import { Schema, model, models } from "mongoose";
import "@/lib/models/Deposit";

const BookingSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },

    services: [
      {
        serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
        serviceName: { type: String },
        serviceDescription: { type: String },
        serviceImage: { type: String },
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
    customerLocation: {
      county: String,
      subCounty: String,
      ward: String,
      address: String,
      locationDescription: String,
      mapsLink: String,
      lat: Number,
      lng: Number,
    },
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
  enum: [
    "pending",
    "pendingDeposit",
    "confirmed",
    "completed",
    "cancelled",
    "rescheduled",
    "refunded",
    "rejected",
    "no_show" // 🔥 ADD THIS
  ],
  default: "pending",
  index: true,
},

completedAt: Date,

completionReminderSent: { type: Boolean, default: false },
thankYouSent: { type: Boolean, default: false },
noShowMarked: { type: Boolean, default: false },
    rejectionReason: String,

    depositAmount: { type: Number, default: 0 },
    depositId: { type: Schema.Types.ObjectId, ref: "Deposit" },
    depositPaidOut: { type: Boolean, default: false },
    depositRefunded: { type: Boolean, default: false },

    manageToken: { type: String, required: true, index: true },
    bookingKey: { type: String, required: true },
    rescheduleCount: { type: Number, default: 0 },

    assignedTo: { type: Schema.Types.ObjectId, ref: "Staff", index: true },
assignedAt: Date,

staffInternalNote: {
  type: String,
},
    source: { type: String, default: "public_link" },
  reminder24hSent: { type: Boolean, default: false },
reminder1hSent: { type: Boolean, default: false },
reminder30mSent: { type: Boolean, default: false },
reminder10mSent: { type: Boolean, default: false },
slotReleasedAt: Date, 
checkedIn: { type: Boolean, default: false },
 
  },
  
  { timestamps: true }
);

// Indexes
BookingSchema.index({ businessId: 1, date: 1, status: 1 });
BookingSchema.index({ bookingKey: 1 }, { unique: true });
BookingSchema.index({ status: 1, date: 1 });
BookingSchema.index({ status: 1, reminder24hSent: 1 });

export default models.Booking || model("Booking", BookingSchema);
