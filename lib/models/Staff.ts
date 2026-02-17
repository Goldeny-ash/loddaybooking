import { Schema, model, models } from "mongoose";

const StaffSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: "Business" },
  name: String,
  role: { type: String, default: "staff" },
  services: [String], // service IDs
  weeklyAvailability: {
    monday: { start: String, end: String },
    tuesday: { start: String, end: String },
    wednesday: { start: String, end: String },
    thursday: { start: String, end: String },
    friday: { start: String, end: String },
    saturday: { start: String, end: String },
    sunday: { start: String, end: String },
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

});

export default models.Staff || model("Staff", StaffSchema);
