const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const sendSMS = require("../utils/sms");
const auth = require("../middleware/auth");
const { getTodayKey } = require("../utils/time");

function emitQueueUpdated(req) {
  req.app.get("io").emit("queueUpdated");
}

router.get("/appointments", auth, async (req, res) => {
  const todayOnly = req.query.scope !== "all";
  const status = String(req.query.status || "").trim();
  const prefix = String(req.query.prefix || "").trim().toUpperCase();

  const filters = {};

  if (todayOnly) {
    filters.dateKey = getTodayKey();
  }

  if (status) {
    filters.status = status;
  }

  if (prefix) {
    filters.prefix = prefix;
  }

  const appointments = await Appointment.find(filters).sort({
    appointmentTime: 1,
    tokenNumber: 1,
  });

  res.json(appointments);
});

router.get("/today-stats", auth, async (req, res) => {
  const todayKey = getTodayKey();

  const [customersToday, waiting, notified, serving, served] = await Promise.all([
    Appointment.countDocuments({ dateKey: todayKey }),
    Appointment.countDocuments({ dateKey: todayKey, status: "waiting" }),
    Appointment.countDocuments({ dateKey: todayKey, status: "notified" }),
    Appointment.countDocuments({ dateKey: todayKey, status: "serving" }),
    Appointment.countDocuments({ dateKey: todayKey, status: "served" }),
  ]);

  res.json({ customersToday, waiting, notified, serving, served });
});

router.put("/appointments/:id/call", auth, async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    {
      status: "serving",
      notificationSent: true,
    },
    { new: true }
  );

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  emitQueueUpdated(req);
  res.json({ message: `${appointment.tokenLabel} is now being served`, appointment });
});

router.put("/appointments/:id/serve", auth, async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    {
      status: "served",
      notificationSent: true,
    },
    { new: true }
  );

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  emitQueueUpdated(req);
  res.json({ message: "Customer served", appointment });
});

router.post("/appointments/:id/notify", auth, async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  await sendSMS(
    appointment.contactValue,
    `Please arrive now. Your token ${appointment.tokenLabel} for ${appointment.serviceName} is ready.`
  );

  appointment.notificationSent = true;
  appointment.status = "notified";
  await appointment.save();

  emitQueueUpdated(req);
  res.json({ message: "Notification sent", appointment });
});

router.delete("/appointments/:id", auth, async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Token not found" });
    }

    emitQueueUpdated(req);
    res.json({ message: "Token cancelled successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Delete failed" });
  }
});

module.exports = router;
