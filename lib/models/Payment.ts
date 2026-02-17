import { Schema, model, models } from "mongoose";

const PaymentSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    amount: Number,
    phone: String,
    reference: String,
    provider: String,
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    rawResponse: Object,
  },
  { timestamps: true }
);

export default models.Payment || model("Payment", PaymentSchema);
