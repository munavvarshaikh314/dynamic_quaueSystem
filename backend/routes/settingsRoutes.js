const express = require("express");
const router = express.Router();
const Settings = require("../models/Settings");
const auth = require("../middleware/auth");
const { buildDefaultSettings, sanitizeServices } = require("../utils/defaultSettings");

async function getOrCreateSettings() {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create(buildDefaultSettings());
  }

  if (!Array.isArray(settings.services) || !settings.services.length) {
    settings.services = sanitizeServices([], settings.slotDuration || 10);
    await settings.save();
  }

  return settings;
}

router.get("/", async (req, res) => {
  const settings = await getOrCreateSettings();
  res.json(settings);
});

router.put("/", auth, async (req, res) => {
  const settings = await getOrCreateSettings();
  const nextSlot = Number(req.body.slotDuration) > 0
    ? Number(req.body.slotDuration)
    : settings.slotDuration || 10;

  settings.shopName = String(req.body.shopName || settings.shopName || "").trim();
  settings.logo = String(req.body.logo || settings.logo || "").trim();
  settings.openTime = String(req.body.openTime || settings.openTime || "09:00");
  settings.closeTime = String(req.body.closeTime || settings.closeTime || "18:00");
  settings.slotDuration = nextSlot;
  settings.displayNote = String(req.body.displayNote || settings.displayNote || "").trim();
  settings.services = sanitizeServices(req.body.services, nextSlot);

  await settings.save();
  res.json(settings);
});

module.exports = router;
