const cron = require("node-cron");
const Appointment = require("../models/Appointment");
const sendSMS = require("../utils/sms");

cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const reminderTime = new Date(now.getTime() + 15 * 60000);

    const appointments = await Appointment.find({
      appointmentTime: { $lte: reminderTime },
      notificationSent: false,
      status: "waiting",
    });

    for (const appt of appointments) {
      await sendSMS(
        appt.contactValue,
        `Hello! Your token ${appt.tokenNumber} will be served in 15 minutes.`
      );

      appt.notificationSent = true;
      appt.status = "notified";
      await appt.save();
    }
  } catch (error) {
    console.error("Scheduler error:", error.message);
  }
});
