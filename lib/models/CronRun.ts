import { Schema, model, models } from "mongoose";

const CronRunSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    date: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["running", "success", "failed"],
      default: "running",
      index: true,
    },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date },
    error: { type: String, default: "" },
  },
  { timestamps: true }
);

export default models.CronRun || model("CronRun", CronRunSchema);

