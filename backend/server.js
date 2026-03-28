const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const settingsRoutes = require("./routes/settingsRoutes");
require("dotenv").config();

const appointmentRoutes = require("./routes/appointmentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const temp = require("./routes/temp");


const cors = require("cors");


const app = express();
app.use(express.json());

// -------- CREATE HTTP SERVER ----------
const server = http.createServer(app);

app.use(cors({
  origin: ["http://localhost:5174"],
  credentials: true,
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type","Authorization"]
}));
// -------- SOCKET.IO ----------
const io = new Server(server, {
  cors: {
    origin: "*", // later we restrict in production
  },
});

// make socket available inside routes
app.set("io", io);

io.on("connection", (socket) => {
  console.log("Client Connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client Disconnected:", socket.id);
  });
});

// -------- ROUTES ----------
app.use("/api/appointments", appointmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/display", temp);
// -------- DB ----------
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/appointments";

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    // ⚠️ IMPORTANT: server.listen not app.listen
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
}

startServer();