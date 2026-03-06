import { Schema, model, models } from "mongoose";

const BusinessSchema = new Schema(
  {
    clerkUserId: { type: String, required: true, unique: true },
    name: String,
    username: { type: String, unique: true },
    phone: String,
    email: String,

    logo: { type: String, default: "" },
    brandColor: String,

    description: { type: String, default: "" },

    openingHours: {
      type: Map,
      of: new Schema({
        open: String,
        close: String,
        closed: { type: Boolean, default: false },
      }),
      default: {},
    },

    bookingRules: {
      autoApprove: Boolean,
      bufferMinutes: Number,
    },

    access: {
      status: {
        type: String,
        enum: ["TRIAL", "ACTIVE", "EXPIRED", "INACTIVE", "GRACE"],
        default: "TRIAL",
        index: true,
      },

      trialStartedAt: Date,
      trialEndsAt: Date,

      subscriptionId: {
        type: String,
        index: true,
      },

      planId: String,
     billing: {
  customerId: { type: String, index: true },
},


      subscriptionExpiresAt: Date,
      lastChargeAt: Date,
      nextChargeAt: Date,

      graceStartedAt: Date,
       graceEndsAt: Date, // 🔥 ADD
  graceWarningSent: { type: Boolean, default: false }, // 🔥 ADD


      lastPaymentRef: String,
    },

    location: {
  county: { type: String, default: "" },
  subCounty: { type: String, default: "" },
  ward: { type: String, default: "" },
  countyOptions: { type: [String], default: [] },
  subCountyOptions: { type: [String], default: [] },
  wardOptions: { type: [String], default: [] },
  addressLine: String,
  locationDescription: { type: String, default: "" },
  lat: Number,
  lng: Number,
},

    setupStep: {
      type: Number,
      default: 1,
    },

    notificationPrefs: {
      whatsapp: Boolean,
      sms: Boolean,
      email: Boolean,
    },

    theme: {
      primary: String,
      accent: String,
    },

    depositPolicy: {
  enabled: { type: Boolean, default: false },
  type: { type: String, enum: ["fixed", "percent"], default: "fixed" },
  value: { type: Number, default: 0 },
  applyToCallout: { type: Boolean, default: false },
},
// Add after depositPolicy or near billing section

wallet: {
  walletId: {
    type: String,
    index: true,
  },
  walletLabel: String,
  walletCurrency: {
    type: String,
    enum: ["KES", "USD", "EUR", "GBP"],
    default: "KES",
  },
  canDisburse: {
    type: Boolean,
    default: true,
  },
  walletCreatedAt: Date,
},

    mobileSettings: {
      enabled: Boolean,
      baseLocation: {
        lat: Number,
        lng: Number,
        address: String,
      },
      calloutPolicy: {
        type: {
          type: String,
          enum: ["fixed", "per_km", "zone"],
        },
        baseFee: Number,
        perKmFee: Number,
        zones: [
          {
            name: String,
            radiusKm: Number,
            fee: Number,
          },
        ],
      },
      maxDistanceKm: Number,
    },

    website: String,
    socialLinks: {
      facebook: String,
      instagram: String,
      twitter: String,
      tiktok: String,
    },
    tags: [String],
  },
  { timestamps: true }
);
BusinessSchema.index({ "access.status": 1 });
BusinessSchema.index({ "access.nextChargeAt": 1 });
export default models.Business || model("Business", BusinessSchema);
