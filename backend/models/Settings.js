const mongoose = require("mongoose");
const { buildDefaultSettings } = require("../utils/defaultSettings");

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    prefix: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String, default: "", trim: true },
    slotDuration: { type: Number, default: 10, min: 1 },
    color: { type: String, default: "#0f766e", trim: true },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema({
  shopName: { type: String, default: buildDefaultSettings().shopName, trim: true },
  logo: { type: String, default: "" },
  openTime: { type: String, default: buildDefaultSettings().openTime },
  closeTime: { type: String, default: buildDefaultSettings().closeTime },
  slotDuration: { type: Number, default: buildDefaultSettings().slotDuration, min: 1 },
  displayNote: { type: String, default: buildDefaultSettings().displayNote, trim: true },
  services: { type: [serviceSchema], default: buildDefaultSettings().services },
});

module.exports = mongoose.model("Settings", settingsSchema);
