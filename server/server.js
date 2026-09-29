require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");
const registrationRoutes = require("./routes/registrations");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/", (req,res) => res.json({ success:true, message:"EventHub API is running" }));
app.get("/api/health", (req,res) => res.json({
  success:true,
  database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
}));

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/admin", adminRoutes);

app.use((req,res) => res.status(404).json({success:false,message:"Route not found"}));
app.use((err,req,res,next) => {
  console.error(err);
  res.status(err.status || 500).json({success:false,message:err.message || "Server error"});
});

async function start() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI missing. Create server/.env from .env.example");
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET missing in server/.env");
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`EventHub API running at http://localhost:${PORT}`));
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}
start();
