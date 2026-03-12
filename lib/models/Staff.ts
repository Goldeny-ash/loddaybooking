import { Schema, model, models } from "mongoose";

const StaffSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: "Business" },
  name: String,
  role: { type: String, default: "staff" },
  services: [String], // service IDs
  weeklyAvailability: {
    monday: { start: String, end: String, closed: { type: Boolean, default: false } },
    tuesday: { start: String, end: String, closed: { type: Boolean, default: false } },
    wednesday: { start: String, end: String, closed: { type: Boolean, default: false } },
    thursday: { start: String, end: String, closed: { type: Boolean, default: false } },
    friday: { start: String, end: String, closed: { type: Boolean, default: false } },
    saturday: { start: String, end: String, closed: { type: Boolean, default: false } },
    sunday: { start: String, end: String, closed: { type: Boolean, default: false } },
  },
  specialties: [String],
  email: String,
  phone: String,

photo: String,

gender: {
  type: String,
  
},

  isOwner: {
  type: Boolean,
  default: false,
},

  availabilityOverrides: [
    {
      date: { type: String, required: true }, // YYYY-MM-DD
      closed: { type: Boolean, default: false },
      blocks: [
        {
          start: String, // HH:mm
          end: String, // HH:mm
          reason: String,
        },
      ],
    },
  ],

});

export default models.Staff || model("Staff", StaffSchema);
