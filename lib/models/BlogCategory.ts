import { Schema, model, models } from "mongoose";

const BlogCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    description: { type: String, default: "", trim: true },
    audience: {
      type: String,
      enum: ["owners", "affiliates", "all"],
      default: "all",
      index: true,
    },
    heroImage: { type: String, default: "" },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

BlogCategorySchema.index({ audience: 1, sortOrder: 1, name: 1 });

export default models.BlogCategory || model("BlogCategory", BlogCategorySchema);
