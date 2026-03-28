const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const { getTodayKey } = require("../utils/time");

// TV Display Screen API
router.get("/", async (req, res) => {
  try {
    const today = getTodayKey();

    const appointments = await Appointment.find({ dateKey: today })
      .select("tokenLabel tokenNumber prefix status")
      .sort({ tokenNumber: 1 });

    res.json(appointments);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;