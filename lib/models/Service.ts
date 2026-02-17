import { Schema, model, models } from "mongoose";

const PriceTierSchema = new Schema(
  {
    label: String,
    min: Number,
    max: Number,
    price: Number,
  },
  { _id: false }
);

const AreaPriceSchema = new Schema(
  {
    area: String,
    min: Number,
    max: Number,
    price: Number,
  },
  { _id: false }
);

const SessionPackageSchema = new Schema(
  {
    sessions: Number,
    price: Number,
  },
  { _id: false }
);

const ServiceSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      index: true,
      required: true,
    },

    // ---------------- CORE ----------------

    name: { type: String, required: true },

    slug: String,

    description: String,

    category: {
      type: String,
      required: true,
      index: true,
    },

    subCategory: String,

    niche: String,

    variant: String,

    tags: [String],

    targetGender: {
      type: String,
      default: "unisex",
    },

    durationMinutes: Number,

    bufferMinutes: { type: Number, default: 0 },

    // ---------------- HAIR ----------------

    hair: {
      hairType: String,
      hairMaterial: String,
      hairOrigin: String,
      lengthTier: String,
      density: String,
      texture: String,
      method: String,
      specialty: String,
      braidStyle: String,
      installMethod: String,
      weaveType: String,
      stylingTarget: String,
      retouchType: String,
      isChemical: { type: Boolean, default: false },
      chemicalType: String,
      relaxerOwnership: String,
      brandUsed: String,
      colorType: String,
      treatmentType: String,
    },

    // ---------------- BODY MOD ----------------

    bodyMod: {
      size: String,
      colorType: String,
    },

    // ---------------- NAILS ----------------

    nails: {
      nailType: String,
      style: String,
      addOns: [
        {
          title: String,
          price: Number,
          durationMinutes: Number,
          perNail: Boolean,
          active: { type: Boolean, default: true },
        },
      ],
    },

    // ---------------- BEAUTY ----------------

    beauty: {
      treatmentType: String,
      technique: String,
      sessionFocus: String,
      packageEligible: Boolean,
    },

    // ---------------- PRICING ----------------

    basePrice: Number,

    priceRange: {
      min: Number,
      max: Number,
    },

    priceTiers: [PriceTierSchema],

    areaPricing: [AreaPriceSchema],

    sessionPackages: [SessionPackageSchema],

    // ---------------- STAFF ----------------

    staffIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Staff",
      },
    ],

    // ---------------- DEPOSIT ----------------

    depositOverride: {
      enabled: Boolean,
      type: {
        type: String,
      },
      value: Number,
    },

    // ---------------- MEDIA ----------------

    gallery: [String],

    featured: { type: Boolean, default: false },

    hidden: { type: Boolean, default: false },

    // ---------------- MOBILE ----------------

    mobileEligible: Boolean,

    travelTimeMinutes: Number,

    // ---------------- BUNDLES ----------------

    isBundle: Boolean,

    bundleItems: [
      {
        serviceId: {
          type: Schema.Types.ObjectId,
          ref: "Service",
        },
        order: Number,
        name: String,
        durationMinutes: Number,
        price: Number,
      },
    ],

    // ---------------- PROMOTIONS ----------------

    promotions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Promotion",
      },
    ],

    // ---------------- ADD-ONS ----------------

    addOns: [
      {
        title: String,
        price: Number,
        durationMinutes: Number,
        hairMaterial: String,
        applicableCategories: [String],
        active: { type: Boolean, default: true },
      },
    ],

    // ---------------- MEDICAL ----------------

    medicalEligible: Boolean,

    medicalDiscountPercent: Number,
  },
  { timestamps: true }
);

export default models.Service || model("Service", ServiceSchema);
