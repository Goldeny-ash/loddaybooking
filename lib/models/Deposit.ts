import { Schema, model, models } from "mongoose";

const DepositSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    amount: { type: Number, required: true },
    phoneNumber: { type: String, required: true },
    status: { type: String, enum: ["PENDING", "PAID", "FAILED"], default: "PENDING" },
    externalReference: { type: String, required: true, unique: true },
    mpesaReceipt: String,
    checkoutRequestId: String,
  },
  { timestamps: true }
);

export default models.Deposit || model("Deposit", DepositSchema);
