import { Schema, model, models } from "mongoose";

const BlogPostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    excerpt: { type: String, default: "", trim: true },
    contentFormat: {
      type: String,
      enum: ["markdown", "html"],
      default: "markdown",
    },
    content: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    gallery: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["draft", "published", "scheduled"],
      default: "draft",
      index: true,
    },
    featured: { type: Boolean, default: false, index: true },
    trending: { type: Boolean, default: false, index: true },
    audience: {
      type: String,
      enum: ["owners", "affiliates", "all"],
      default: "all",
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "BlogCategory",
      default: null,
      index: true,
    },
    categoryName: { type: String, default: "", trim: true },
    categorySlug: { type: String, default: "", trim: true, index: true },
    tags: { type: [String], default: [] },
    seoTitle: { type: String, default: "", trim: true },
    seoDescription: { type: String, default: "", trim: true },
    internalLinks: {
      type: [
        new Schema(
          {
            postId: { type: Schema.Types.ObjectId, ref: "BlogPost", default: null },
            title: { type: String, default: "", trim: true },
            slug: { type: String, default: "", trim: true },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    cta: {
      title: { type: String, default: "", trim: true },
      description: { type: String, default: "", trim: true },
      label: { type: String, default: "", trim: true },
      href: { type: String, default: "", trim: true },
    },
    popup: {
      enabled: { type: Boolean, default: false },
      headline: { type: String, default: "", trim: true },
      subheadline: { type: String, default: "", trim: true },
      label: { type: String, default: "", trim: true },
      href: { type: String, default: "", trim: true },
      image: { type: String, default: "" },
      trigger: {
        type: String,
        enum: ["scroll", "bottom"],
        default: "scroll",
      },
    },
    authorName: { type: String, default: "Lodday Team", trim: true },
    publishedAt: { type: Date, default: null, index: true },
    scheduledFor: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

BlogPostSchema.index({ status: 1, publishedAt: -1 });
BlogPostSchema.index({ audience: 1, featured: 1, publishedAt: -1 });
BlogPostSchema.index({ categorySlug: 1, publishedAt: -1 });
BlogPostSchema.index({ tags: 1 });

const existingModel = models.BlogPost;

if (
  existingModel &&
  (!existingModel.schema.path("popup") || !existingModel.schema.path("contentFormat"))
) {
  delete models.BlogPost;
}

export default models.BlogPost || model("BlogPost", BlogPostSchema);
