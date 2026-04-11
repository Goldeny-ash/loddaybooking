import { Schema, model, models } from "mongoose";

const SupportMessageSchema = new Schema(
  {
    senderRole: {
      type: String,
      enum: ["customer", "admin"],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const SupportConversationSchema = new Schema(
  {
    visitorId: {
      type: String,
      required: true,
      index: true,
    },
    scopeType: {
      type: String,
      enum: ["general", "business", "booking"],
      required: true,
      index: true,
    },
    scopeKey: {
      type: String,
      required: true,
      index: true,
    },
    pathname: {
      type: String,
      default: "/",
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      default: null,
    },
    businessName: {
      type: String,
      default: "",
    },
    customerName: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      default: "",
    },
    unreadForAdmin: {
      type: Boolean,
      default: false,
    },
    unreadForVisitor: {
      type: Boolean,
      default: false,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastMessagePreview: {
      type: String,
      default: "",
    },
    messages: {
      type: [SupportMessageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

SupportConversationSchema.index({ visitorId: 1, scopeKey: 1 }, { unique: true });
SupportConversationSchema.index({ lastMessageAt: -1 });

export default models.SupportConversation ||
  model("SupportConversation", SupportConversationSchema);
