import { Schema, model, models } from "mongoose";

const ReferenceImageSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },

  // Each entry can contain multiple images
  images: [
    {
      url: { type: String, required: true },          // Cloudinary or S3 URL
      description: { type: String, default: "" },     // Optional description
      totalCost: { type: Number, default: 0 },        // Total service cost for this work
      durationMinutes: { type: Number, default: 0 },  // Total time for this exact style
      priceBreakdown: { type: String, default: "" },  // Human readable breakdown
      likes: { type: Number, default: 0 },            // Optional persisted likes counter
      staffId: { type: Schema.Types.ObjectId, ref: "Staff" },  // Staff who did it
      tags: { type: [String], default: [] },          // Tags for filtering
    },
  ],

  // Services that use this reference
  linkedServiceIds: [{ type: Schema.Types.ObjectId, ref: "Service" }],

  createdAt: { type: Date, default: Date.now },
});

export default models.ReferenceImage || model("ReferenceImage", ReferenceImageSchema);
