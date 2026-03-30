const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const Settings = require("../models/Settings");
const CounterToken = require("../models/CounterToken");
const { getTodayKey, getCurrentTime } = require("../utils/time");
const { buildDefaultSettings } = require("../utils/defaultSettings");

function buildTimeForToday(timeValue) {
  const [hours, minutes] = String(timeValue || "00:00")
    .split(":")
    .map(Number);

  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

async function getSettings() {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create(buildDefaultSettings());
  }

  return settings;
}

router.post("/", async (req, res) => {
  try {
    const rawName = String(req.body.name || "").trim();
    const contactType = String(req.body.contactType || "phone").trim();
    const contactValue = String(req.body.contactValue || "").trim();
    const prefix = String(req.body.prefix || "A").trim().toUpperCase();

    if (rawName.length < 2) {
      return res.status(400).json({ message: "Please enter a valid customer name" });
    }

    if (contactType === "phone" || contactType === "whatsapp") {
      if (!/^[6-9]\d{9}$/.test(contactValue)) {
        return res.status(400).json({
          message: "Enter a valid 10 digit mobile number",
        });
      }
    }

    const settings = await getSettings();
    const services = Array.isArray(settings.services) && settings.services.length
      ? settings.services
      : buildDefaultSettings().services;

    const service = services.find((item) => item.prefix === prefix);

    if (!service) {
      return res.status(400).json({ message: "Selected service is not available" });
    }

    const nowTime = getCurrentTime();
    if (nowTime < settings.openTime || nowTime > settings.closeTime) {
      return res.status(403).json({
        message: `Shop closed (Open ${settings.openTime} - ${settings.closeTime})`,
      });
    }

    const todayKey = getTodayKey();
    const existing = await Appointment.findOne({
      dateKey: todayKey,
      contactValue,
      prefix,
      status: { $in: ["waiting", "notified", "serving"] },
    });

    if (existing) {
      return res.status(400).json({
        message: `You already have token ${existing.tokenLabel} for ${existing.serviceName}`,
      });
    }

    const counter = await CounterToken.findOneAndUpdate(
      { dateKey: todayKey, prefix },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const tokenNumber = counter.seq;
    const tokenLabel = `${prefix}-${tokenNumber}`;

    const lastAppointment = await Appointment.findOne({
      dateKey: todayKey,
      prefix,
    }).sort({ tokenNumber: -1 });

    const slotDuration = service.slotDuration || settings.slotDuration || 10;
    let appointmentTime = lastAppointment
      ? new Date(lastAppointment.appointmentTime.getTime() + slotDuration * 60000)
      : new Date();

    const openingDateTime = buildTimeForToday(settings.openTime);
    const closingDateTime = buildTimeForToday(settings.closeTime);

    if (appointmentTime < openingDateTime) {
      appointmentTime = openingDateTime;
    }

    if (appointmentTime > closingDateTime) {
      return res.status(403).json({
        message: "No more slots available today",
      });
    }

    const appointment = await Appointment.create({
      name: rawName,
      contactType,
      contactValue,
      prefix,
      serviceName: service.name,
      tokenNumber,
      tokenLabel,
      appointmentTime,
      dateKey: todayKey,
      status: "waiting",
    });

    req.app.get("io").emit("queueUpdated");

    res.status(201).json({
      id: appointment._id,
      serviceName: appointment.serviceName,
      tokenNumber,
      tokenLabel,
      appointmentTime,
      status: appointment.status,
      message: "Token booked successfully",
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "A token already exists for this service. Please retry.",
      });
    }

    res.status(500).json({ error: err.message });
  }
});

router.get("/:prefix/:tokenNumber", async (req, res) => {
  const prefix = String(req.params.prefix || "").trim().toUpperCase();
  const tokenNumber = Number(req.params.tokenNumber);
  const todayKey = getTodayKey();

  const appointment = await Appointment.findOne({
    prefix,
    tokenNumber,
    dateKey: todayKey,
  });

  if (!appointment) {
    return res.status(404).json({ message: "Token not found" });
  }

  res.json({
    tokenNumber: appointment.tokenNumber,
    tokenLabel: appointment.tokenLabel,
    serviceName: appointment.serviceName,
    appointmentTime: appointment.appointmentTime,
    status: appointment.status,
  });
});

module.exports = router;
