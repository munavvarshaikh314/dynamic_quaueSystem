exports.getTodayKey = () => {
  const ist = new Date().toLocaleString("en-CA", {
    timeZone: "Asia/Kolkata"
  });
  return ist.slice(0,10);
};

exports.getCurrentTime = () => {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata"
  });
};