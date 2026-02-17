// models/BusinessAvailability.ts
import mongoose from "mongoose";

const DaySchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  start: String, // "09:00"
  end: String,   // "18:00"
});

const BusinessAvailabilitySchema = new mongoose.Schema({
  businessId: { type: String, required: true }, // Clerk org/user ID
  timezone: { type: String, default: "Africa/Nairobi" },
  week: {
    monday: DaySchema,
    tuesday: DaySchema,
    wednesday: DaySchema,
    thursday: DaySchema,
    friday: DaySchema,
    saturday: DaySchema,
    sunday: DaySchema,
  },
});

export default mongoose.models.BusinessAvailability ||
  mongoose.model("BusinessAvailability", BusinessAvailabilitySchema);
