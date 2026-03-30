const cron = require("node-cron");
const Appointment = require("../models/Appointment");
const sendSMS = require("../utils/sms");
const { getTodayKey } = require("../utils/time");

function startScheduler(io) {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const reminderTime = new Date(now.getTime() + 15 * 60000);
      const todayKey = getTodayKey();

      const appointments = await Appointment.find({
        dateKey: todayKey,
        appointmentTime: { $lte: reminderTime, $gte: now },
        notificationSent: false,
        status: "waiting",
      });

      if (!appointments.length) {
        return;
      }

      for (const appointment of appointments) {
        await sendSMS(
          appointment.contactValue,
          `Hello! Your token ${appointment.tokenLabel} for ${appointment.serviceName} will be served in about 15 minutes.`
        );

        appointment.notificationSent = true;
        appointment.status = "notified";
        await appointment.save();
      }

      if (io) {
        io.emit("queueUpdated");
      }
    } catch (error) {
      console.error("Scheduler error:", error.message);
    }
  });
}

module.exports = startScheduler;
