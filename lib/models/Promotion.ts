import { Schema, model, models } from "mongoose";

const PromotionSchema = new Schema(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["percent", "fixed", "first_time", "off_peak"],
      required: true,
    },
    description: String,
    value: { type: Number, required: true },
    promoCode: { type: String },
    startDate: Date,
    endDate: Date,
    stackable: { type: Boolean, default: false },
    firstTimeOnly: { type: Boolean, default: false },
    maxRedemptions: Number,
    redeemedCount: { type: Number, default: 0 },
    offPeak: {
      days: [String],
      startTime: String,
      endTime: String,
    },
    active: { type: Boolean, default: true },
    services: [
      {
        type: Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
  },
  { timestamps: true }
);

export default models.Promotion || model("Promotion", PromotionSchema);
