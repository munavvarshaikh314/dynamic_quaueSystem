const mongoose = require("mongoose");

const ownerSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
});

module.exports = mongoose.model("Owner", ownerSchema);