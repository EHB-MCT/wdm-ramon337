const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

const Event = require("./models/Event");
const User = require("./models/User");

const authRoutes = require("./routes/auth");

const verifyToken = require("./middleware/auth");

const corsOptions = {
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(express.json());
app.use(cors(corsOptions));

app.use("/api/auth", authRoutes);

app.post("/api/log", verifyToken, async (req, res) => {
  try {
    const { eventType, eventData } = req.body;

    const newEvent = new Event({
      userId: req.user.uid,
      eventType: eventType,
      eventData: eventData,
    });

    await newEvent.save();

    res.status(201).json({ status: "logged" });
  } catch (err) {
    console.error("Logging error:", err);
    res.status(500).json({ error: "Failed to log" });
  }
});

app.get("/api/admin/data", verifyToken, async (req, res) => {
  try {
    const users = await User.find().select("-password");

    const events = await Event.find();

    console.log(`Admin data fetched: ${users.length} users, ${events.length} events.`);

    res.json({
      users: users,
      events: events,
    });
  } catch (err) {
    console.error("Admin error:", err);
    res.status(500).json({ error: "Server error fetching admin data" });
  }
});

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
    process.exit(1);
  });

app.get("/", (req, res) => {
  res.send("Planner API is running!");
});
