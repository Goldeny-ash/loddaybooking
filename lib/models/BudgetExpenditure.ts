import { Schema, model, models } from "mongoose";

const BudgetExpenditureSchema = new Schema(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "BudgetCategory",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    spentAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export default models.BudgetExpenditure ||
  model("BudgetExpenditure", BudgetExpenditureSchema);
