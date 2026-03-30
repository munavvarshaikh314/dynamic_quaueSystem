const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const Appointment = require("./models/Appointment");
const CounterToken = require("./models/CounterToken");
const Owner = require("./models/Owner");
const Settings = require("./models/Settings");
const appointmentRoutes = require("./routes/appointmentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const authRoutes = require("./routes/authRoutes");
const displayRoutes = require("./routes/temp");
const startScheduler = require("./cron/schedular");
require("dotenv").config();

const app = express();
app.use(express.json());

const allowedOrigins = (process.env.FRONTEND_ORIGINS || [
  "http://localhost:5173",
  "http://localhost:5174",
].join(","))
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });
app.set("io", io);
startScheduler(io);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/appointments", appointmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/display", displayRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/appointments";

async function syncDatabaseIndexes() {
  try {
    await Appointment.collection.dropIndex("dateKey_1_contactValue_1");
    console.log("Dropped legacy appointment contact index");
  } catch (error) {
    if (error.codeName !== "IndexNotFound" && !String(error.message).includes("index not found")) {
      console.error("Failed to drop legacy appointment index:", error.message);
    }
  }

  await Promise.all([
    Appointment.syncIndexes(),
    CounterToken.syncIndexes(),
    Owner.syncIndexes(),
    Settings.syncIndexes(),
  ]);
}

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");
    await syncDatabaseIndexes();

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
}

startServer();
