const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  shopName: String,
  logo: String,
  openTime: String,   // "09:00"
  closeTime: String,  // "18:00"
  //tokenPrefix: { type: String, default: "" }, we upgrade to dynamic prefix setting
  slotDuration: { type: Number, default: 10 }
});

module.exports = mongoose.model("Settings", settingsSchema);