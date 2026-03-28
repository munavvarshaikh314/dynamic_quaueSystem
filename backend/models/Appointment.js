const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },

  contactType: { type: String, enum: ["phone", "whatsapp"], required: true },

  contactValue: { type: String, required: true, trim: true },

   prefix: { type: String, required: true, index: true }, // ⭐ ADD THIS 

  tokenNumber: { type: Number, required: true, index: true },

  tokenLabel: { type: String, index: true },

  dateKey: { type: String, index: true },

  appointmentTime: { type: Date, required: true, index: true },

  status: {
    type: String,
    enum: ["waiting", "notified", "served"],
    default: "waiting",
    index: true,
  },

  notificationSent: { type: Boolean, default: false }

}, { timestamps: true });


// ⭐ REAL FIX — daily uniqueness
// appointmentSchema.index(
//   { tokenNumber: 1, dateKey: 1, tokenLabel: 1 },
//   { unique: true }
// );
// convert to saas multiple counter sys
// this is for unique token for all prefix ex A ,B, C work independalty without conflict
appointmentSchema.index(
  { tokenNumber: 1, dateKey: 1, prefix: 1 },
  { unique: true }
);

appointmentSchema.index(
  { dateKey: 1, contactValue: 1 },
  { unique: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);