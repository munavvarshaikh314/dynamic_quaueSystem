const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  name: String,
  prefix: String,
  active: { type: Boolean, default: true }
});

module.exports = mongoose.model("Counter", counterSchema);