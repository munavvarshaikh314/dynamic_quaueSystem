const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const Settings = require("../models/Settings");
const { getTodayKey } = require("../utils/time");
const { buildDefaultSettings } = require("../utils/defaultSettings");

router.get("/", async (req, res) => {
  try {
    const today = getTodayKey();
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create(buildDefaultSettings());
    }

    const appointments = await Appointment.find({
      dateKey: today,
      status: { $in: ["waiting", "notified", "serving"] },
    })
      .select("tokenLabel tokenNumber prefix serviceName status appointmentTime")
      .sort({ appointmentTime: 1, tokenNumber: 1 });

    res.json({
      settings: {
        shopName: settings.shopName,
        displayNote: settings.displayNote,
        services: settings.services,
      },
      appointments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
