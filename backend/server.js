require("dotenv").config(); // Load environment variables first
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

// Import Models
const Event = require("./models/Event");
const User = require("./models/User");

// Import Routes & Middleware
const authRoutes = require("./routes/auth");
const verifyToken = require("./middleware/auth");

// CORS Configuration
const corsOptions = {
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

// Middleware Setup
app.use(express.json());
app.use(cors(corsOptions));

// Mount Auth Routes
app.use("/api/auth", authRoutes);

// 

/**
 * @route   POST /api/log/event
 * @desc    Log user activity for surveillance (Shadow Profiling)
 * @access  Private
 */
app.post("/api/log/event", verifyToken, async (req, res) => {
  try {
    const { eventType, eventData, location } = req.body;

    const newEvent = new Event({
      userId: req.user.uid, // Taken from the verified token
      eventType: eventType,
      eventData: eventData || {}, // Default to empty object if missing
      location: location || "",   // Optional: capture inferred location
    });

    await newEvent.save();

    res.status(201).json({ status: "logged" });
  } catch (err) {
    console.error("Logging Error:", err.message);
    res.status(500).json({ error: "Failed to log event" });
  }
});

/**
 * @route   GET /api/admin/data
 * @desc    Retrieve all users and events for the Admin Dashboard
 * @access  Private (Admin only)
 */
app.get("/api/admin/data", verifyToken, async (req, res) => {
  try {
    const requestingUser = await User.findOne({ uid: req.user.uid });

    // Role-based Access Control (RBAC)
    if (!requestingUser || requestingUser.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const users = await User.find().select("-password"); // Exclude hashed passwords for safety
    const events = await Event.find();

    // console.log(`Admin data fetched: ${users.length} users, ${events.length} events.`);

    res.json({
      users: users,
      events: events,
    });
  } catch (err) {
    console.error("Admin Fetch Error:", err.message);
    res.status(500).json({ error: "Server error fetching admin data" });
  }
});

/**
 * @route   DELETE /api/admin/reset
 * @desc    "The Nuke Button" - Clears all data to reset the simulation
 * @access  Private (Admin only)
 */
app.delete("/api/admin/reset", verifyToken, async (req, res) => {
  try {
    const requestingUser = await User.findOne({ uid: req.user.uid });

    if (!requestingUser || requestingUser.role !== 'admin') {
      return res.status(403).json({ error: "Access denied." });
    }

    await Event.deleteMany({});
    await User.deleteMany({});

    res.json({ message: "Database cleared successfully" });
  } catch (err) {
    console.error("Reset Error:", err.message);
    res.status(500).json({ error: "Failed to reset database" });
  }
});

// Database Connection
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 8080;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    // Exit process with failure code so Docker knows to restart
    process.exit(1);
  });

// Health Check Route
app.get("/", (req, res) => {
  res.send("Planner API is running!");
});