const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const sendSMS = require("../utils/sms");
const auth = require("../middleware/auth");

// GET all appointments
router.get("/appointments", auth, async (req, res) => {
  const appointments = await Appointment.find().sort({ appointmentTime: 1 });
  res.json(appointments);
});

// SERVE
router.put("/appointments/:id/serve", async (req, res) => {
  await Appointment.findByIdAndUpdate(req.params.id, { status: "served" });
   const io = req.app.get("io");
  io.emit("queueUpdated");
  res.json({ message: "Customer served" });
});

// NOTIFY
router.post("/appointments/:id/notify", async (req, res) => {
  const appt = await Appointment.findById(req.params.id);
  if (!appt) return res.status(404).json({ message: "Appointment not found" });

  await sendSMS(
    appt.contactValue,
    `Please arrive now. Your token ${appt.tokenNumber} is ready.`
  );

  appt.notificationSent = true;
  await appt.save();

    const io = req.app.get("io");
  io.emit("queueUpdated");

  res.json({ message: "Notification sent" });
});

// ⭐ DELETE (ADD HERE ONLY)
router.delete("/appointments/:id", async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Token not found" });
    }
      
    const io = req.app.get("io");
    io.emit("queueUpdated");
    res.json({ message: "Token deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Delete failed" });
  }
});


router.get("/today-stats", auth, async (req, res) => {
  const start = new Date();
  start.setHours(0,0,0,0);

  const end = new Date();
  end.setHours(23,59,59,999);

  const count = await Appointment.countDocuments({
    createdAt: { $gte: start, $lte: end }
  });

  res.json({ customersToday: count });
});

module.exports = router;