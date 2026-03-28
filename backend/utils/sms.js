const twilio = require("twilio");

function getClient() {
  const sid = process.env.TWILIO_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token || sid === "your_sid" || token === "your_token") {
    return null;
  }

  return twilio(sid, token);
}

// 🔥 format phone number (India default)
function formatPhone(to) {
  if (!to) return to;

  let number = to.toString().trim();

  // already international
  if (number.startsWith("+")) return number;

  // remove spaces and dashes
  number = number.replace(/[\s-]/g, "");

  // remove leading 0
  if (number.startsWith("0")) number = number.slice(1);

  // if 10 digit → assume India
  if (number.length === 10) return "+91" + number;

  return number;
}

async function sendSMS(to, message) {
  const client = getClient();
  const from = process.env.TWILIO_PHONE;

  if (!client || !from || from === "your_number") {
    console.log(`SMS skipped (Twilio not configured): ${to} -> ${message}`);
    return { skipped: true };
  }

  const formatted = formatPhone(to);

  try {
    const res = await client.messages.create({
      body: message,
      from,
      to: formatted,
    });

    console.log("SMS sent:", formatted);
    return res;
  } catch (err) {
    console.error("SMS ERROR:", err.message);
    return { error: err.message };
  }
}

module.exports = sendSMS;