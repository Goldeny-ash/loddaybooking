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

      lastPaymentRef: String,
    },

    location: {
      name: String,
      addressLine: String,
      area: String,
      city: String,
      county: String,
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
      enabled: Boolean,
      type: { type: String, enum: ["fixed", "percent"] },
      value: Number,
      applyToCallout: Boolean,
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

export default models.Business || model("Business", BusinessSchema);
