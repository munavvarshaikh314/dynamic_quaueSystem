const express = require("express");
const router = express.Router();
const Settings = require("../models/Settings");
const auth = require("../middleware/auth");

// GET SETTINGS
router.get("/", async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  res.json(settings);
});

// UPDATE SETTINGS
router.put("/", auth, async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});

  Object.assign(settings, req.body);
  await settings.save();

  res.json(settings);
});

module.exports = router;