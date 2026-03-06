import { Schema, model, models } from "mongoose";

const BudgetCategorySchema = new Schema(
  {
    name: { type: String, required: true },
    monthlyAllocation: { type: Number, default: 0 },
    color: { type: String, default: "#0ea5e9" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.BudgetCategory ||
  model("BudgetCategory", BudgetCategorySchema);
