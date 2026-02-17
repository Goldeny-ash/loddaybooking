import { Schema, model, models } from "mongoose";

const ReferenceImageSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },

  // Each entry can contain multiple images
  images: [
    {
      url: { type: String, required: true },          // Cloudinary or S3 URL
      description: { type: String, default: "" },     // Optional description
      dateDone: { type: Date },                       // When work was done
      staffId: { type: Schema.Types.ObjectId, ref: "Staff" },  // Staff who did it
      tags: { type: [String], default: [] },          // Tags for filtering
    },
  ],

  // Services that use this reference
  linkedServiceIds: [{ type: Schema.Types.ObjectId, ref: "Service" }],

  createdAt: { type: Date, default: Date.now },
});

export default models.ReferenceImage || model("ReferenceImage", ReferenceImageSchema);
