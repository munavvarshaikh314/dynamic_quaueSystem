const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contactType: { type: String, enum: ["phone", "whatsapp"], required: true },
    contactValue: { type: String, required: true, trim: true },
    prefix: { type: String, required: true, index: true, uppercase: true },
    serviceName: { type: String, required: true, trim: true },
    tokenNumber: { type: Number, required: true, index: true },
    tokenLabel: { type: String, index: true },
    dateKey: { type: String, index: true },
    appointmentTime: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["waiting", "notified", "serving", "served"],
      default: "waiting",
      index: true,
    },
    notificationSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

appointmentSchema.index(
  { tokenNumber: 1, dateKey: 1, prefix: 1 },
  { unique: true }
);

appointmentSchema.index(
  { dateKey: 1, contactValue: 1, prefix: 1 },
  { unique: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
