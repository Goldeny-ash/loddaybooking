import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    clerkUserId: { type: String, required: true, unique: true },
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
  },
  { timestamps: true }
);

export default models.User || model("User", UserSchema);