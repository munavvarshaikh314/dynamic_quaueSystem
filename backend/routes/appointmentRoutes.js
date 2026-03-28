const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const sendSMS = require("../utils/sms");
const Settings = require("../models/Settings");
const { getTodayKey, getCurrentTime } = require("../utils/time");

const CounterToken = require("../models/CounterToken");

// router.post("/", async (req, res) => {
//   try {
//     //const { name, contactType, contactValue } = req.body;
//     // we upgrade to atuo prefix generate Upgrade To Dynamic Prefix
//     const { name, contactType, contactValue, prefix } = req.body;

//     // ---------------- PHONE VALIDATION ----------------
//     if (contactType === "phone") {
//       if (!/^[6-9]\d{9}$/.test(contactValue)) {
//         return res.status(400).json({
//           message: "Enter valid 10 digit mobile number"
//         });
//       }
//     }

//     const settings = await Settings.findOne();
//     if (!settings) return res.status(500).json({ message: "Shop settings missing" });

//     // ---------------- SHOP CLOSED CHECK ----------------
//     const nowTime = getCurrentTime();

//     if (nowTime < settings.openTime || nowTime > settings.closeTime) {
//       return res.status(403).json({
//         message: `Shop closed (Open ${settings.openTime} - ${settings.closeTime})`
//       });
//     }

//     // ---------------- CORRECT DATE KEY (IST) ----------------
//     const todayKey = getTodayKey();

//     // ---------------- FIND LAST TOKEN ----------------

//     // const lastAppointment = await Appointment.findOne({ dateKey: todayKey })
//     //   .sort({ tokenNumber: -1 });

//     // let tokenNumber = lastAppointment ? lastAppointment.tokenNumber + 1 : 1;

//     // const tokenPrefix = settings.tokenPrefix || "A";
//     // const tokenLabel = `${tokenPrefix}-${tokenNumber}`;

//     // gone upgrade from scheduling queue to live quiue like walk-in system 
//    // ---------------- FIND LAST TOKEN (PREFIX AWARE) ----------------
//    // this fir sinlge counter logic means only for 1 counter
// // const tokenPrefix = settings.tokenPrefix || "A";

// // const lastAppointment = await Appointment.findOne({
// //   dateKey: todayKey,
// //   tokenLabel: { $regex: `^${tokenPrefix}-` }
// // }).sort({ tokenNumber: -1 });

// // // Generate token number safely
// // let tokenNumber = lastAppointment ? lastAppointment.tokenNumber + 1 : 1;

// // const tokenLabel = `${tokenPrefix}-${tokenNumber}`;

// // now we upgrade to saas means we can add multiple counter token A, B, C..
// //const tokenPrefix = settings.tokenPrefix || "A"; // conver to dymanic prefix


// // const lastAppointment = await Appointment.findOne({
// //   dateKey: todayKey,
// //   prefix: tokenPrefix
// // }).sort({ tokenNumber: -1 });

// // let tokenNumber = lastAppointment ? lastAppointment.tokenNumber + 1 : 1;

// // const tokenLabel = `${tokenPrefix}-${tokenNumber}`;

// // now we upgrade one more level

// const tokenPrefix = prefix?.trim() || "A"; // dynamic

// const counter = await CounterToken.findOneAndUpdate(
//   { dateKey: todayKey, prefix: tokenPrefix },
//   { $inc: { seq: 1 } },
//   { new: true, upsert: true }
// );

// const tokenNumber = counter.seq;
// const tokenLabel = `${tokenPrefix}-${tokenNumber}`;

// const lastAppointment = await Appointment.findOne({
//   dateKey: todayKey,
//   prefix: tokenPrefix
// }).sort({ tokenNumber: -1 });
//     // ---------------- TIME SLOT CALCULATION ----------------
//     let appointmentTime;
// const slot = settings.slotDuration || 10;

// const now = new Date();

// if (!lastAppointment) {
//   // First booking today → start from NOW
//   appointmentTime = new Date(now);
// } else {
//   // Add slot duration to last token time
//   appointmentTime = new Date(
//     lastAppointment.appointmentTime.getTime() + slot * 60000
//   );
// }

// // Check generated slot does not exceed closing time
// const [ch, cm] = settings.closeTime.split(":").map(Number);
// const closingDateTime = new Date(
//   now.getFullYear(),
//   now.getMonth(),
//   now.getDate(),
//   ch,
//   cm
// );

// const [oh, om] = settings.openTime.split(":").map(Number);

// const openingDateTime = new Date(
//   now.getFullYear(),
//   now.getMonth(),
//   now.getDate(),
//   oh,
//   om,
//   0
// );

// if (appointmentTime < openingDateTime) {
//   appointmentTime = openingDateTime;
// }

// if (appointmentTime > closingDateTime) {
//   return res.status(403).json({
//     message: "No more slots available today"
//   });
// }

//     // ---------------- SAVE ----------------
//     // await Appointment.create({
//     //   name,
//     //   contactType,
//     //   contactValue,
//     //   tokenNumber,
//     //   tokenLabel,
//     //   appointmentTime,
//     //   dateKey: todayKey,
//     //   status: "waiting"
//     // });

//   await Appointment.create({
//   name,
//   contactType,
//   contactValue,
//   prefix: tokenPrefix,  // ⭐ IMPORTANT // this convert sinle to mul counter token like SaaS
//   tokenNumber,
//   tokenLabel,
//   appointmentTime,
//   dateKey: todayKey,
//   status: "waiting"
// });

//     req.app.get("io").emit("queueUpdated");

//     res.status(201).json({
//       tokenNumber,
//       tokenLabel,
//       appointmentTime,
//       message: "Token booked successfully"
//     });

//   } catch (err) {
//     if (err.code === 11000)
//       return res.status(409).json({ message: "Token collision — retry" });

//     res.status(500).json({ error: err.message });
//   }
// });

// new clean route with prevent duplicate and do no generate same no token again at same time or day
router.post("/", async (req, res) => {
  try {
    const { name, contactType, contactValue, prefix } = req.body;

    // ---------------- PHONE VALIDATION ----------------
    if (contactType === "phone") {
      if (!/^[6-9]\d{9}$/.test(contactValue)) {
        return res.status(400).json({
          message: "Enter valid 10 digit mobile number"
        });
      }
    }

    const settings = await Settings.findOne();
    if (!settings) {
      return res.status(500).json({ message: "Shop settings missing" });
    }

    const todayKey = getTodayKey();

    // ---------------- BLOCK DUPLICATE PHONE BOOKINGS ----------------
    const existing = await Appointment.findOne({
      dateKey: todayKey,
      contactValue,
      status: { $ne: "served" }
    });

    if (existing) {
      return res.status(400).json({
        message: `You already have token ${existing.tokenLabel}`
      });
    }

    // ---------------- SHOP CLOSED CHECK ----------------
    const nowTime = getCurrentTime();

    if (nowTime < settings.openTime || nowTime > settings.closeTime) {
      return res.status(403).json({
        message: `Shop closed (Open ${settings.openTime} - ${settings.closeTime})`
      });
    }

    // ---------------- TOKEN PREFIX ----------------
    const tokenPrefix = prefix?.trim() || "A";

    // ---------------- ATOMIC TOKEN GENERATION ----------------
    const counter = await CounterToken.findOneAndUpdate(
      { dateKey: todayKey, prefix: tokenPrefix },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const tokenNumber = counter.seq;
    const tokenLabel = `${tokenPrefix}-${tokenNumber}`;

    // ---------------- LAST APPOINTMENT ----------------
    const lastAppointment = await Appointment.findOne({
      dateKey: todayKey,
      prefix: tokenPrefix
    }).sort({ tokenNumber: -1 });

    // ---------------- TIME SLOT CALCULATION ----------------
    let appointmentTime;
    const slot = settings.slotDuration || 10;
    const now = new Date();

    if (!lastAppointment) {
      appointmentTime = new Date(now);
    } else {
      appointmentTime = new Date(
        lastAppointment.appointmentTime.getTime() + slot * 60000
      );
    }

    // ---------------- OPENING TIME ----------------
    const [oh, om] = settings.openTime.split(":").map(Number);

    const openingDateTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      oh,
      om,
      0
    );

    if (appointmentTime < openingDateTime) {
      appointmentTime = openingDateTime;
    }

    // ---------------- CLOSING TIME ----------------
    const [ch, cm] = settings.closeTime.split(":").map(Number);

    const closingDateTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      ch,
      cm,
      0
    );

    if (appointmentTime > closingDateTime) {
      return res.status(403).json({
        message: "No more slots available today"
      });
    }

    // ---------------- SAVE APPOINTMENT ----------------
    await Appointment.create({
      name,
      contactType,
      contactValue,
      prefix: tokenPrefix,
      tokenNumber,
      tokenLabel,
      appointmentTime,
      dateKey: todayKey,
      status: "waiting"
    });

    req.app.get("io").emit("queueUpdated");

    res.status(201).json({
      tokenNumber,
      tokenLabel,
      appointmentTime,
      message: "Token booked successfully"
    });

  } catch (err) {

    if (err.code === 11000) {
      return res.status(409).json({
        message: "Token already exists, please retry"
      });
    }

    res.status(500).json({ error: err.message });
  }
});



//new route
router.get("/:prefix/:tokenNumber", async (req, res) => {

  const { prefix, tokenNumber } = req.params;

  const todayKey = getTodayKey();

  const appointment = await Appointment.findOne({
    prefix,
    tokenNumber,
    dateKey: todayKey
  });

  if (!appointment) {
    return res.status(404).json({ message: "Token not found" });
  }

  res.json({
    tokenNumber: appointment.tokenNumber,
    tokenLabel: appointment.tokenLabel,
    appointmentTime: appointment.appointmentTime,
    status: appointment.status
  });
});


// DELETE APPOINTMENT (CANCEL TOKEN)


module.exports = router;
