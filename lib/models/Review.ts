import { Schema, model, models } from "mongoose";

const ReviewSchema = new Schema(
  {
    reviewType: {
      type: String,
      enum: ["platform", "business"],
      required: true,
      index: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5, index: true },
    comment: { type: String, default: "" },

    businessId: { type: Schema.Types.ObjectId, ref: "Business", index: true },
    businessName: { type: String, default: "" },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", index: true },

    reviewerName: { type: String, required: true },
    isAnonymous: { type: Boolean, default: false },

    avatar: {
      kind: {
        type: String,
        enum: ["logo", "photo", "animal", "element", "initials"],
        default: "initials",
      },
      value: { type: String, default: "" },
      imageUrl: { type: String, default: "" },
    },

    photoUrls: [{ type: String }],

    source: {
      type: String,
      enum: ["home", "manage", "email", "direct"],
      default: "direct",
      index: true,
    },

    status: {
      type: String,
      enum: ["approved", "pending", "hidden"],
      default: "approved",
      index: true,
    },
  },
  { timestamps: true }
);

ReviewSchema.index({ reviewType: 1, businessId: 1, createdAt: -1 });
ReviewSchema.index({ status: 1, createdAt: -1 });

export default models.Review || model("Review", ReviewSchema);

