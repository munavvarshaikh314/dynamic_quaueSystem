const mongoose = require("mongoose");

const counterTokenSchema = new mongoose.Schema({
  dateKey: String,
  prefix: String,
  seq: { type: Number, default: 0 }
});

counterTokenSchema.index({ dateKey: 1, prefix: 1 }, { unique: true });

module.exports = mongoose.model("CounterToken", counterTokenSchema);