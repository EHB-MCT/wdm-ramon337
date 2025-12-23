const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const JWT_SECRET = "RamonDev5";

router.post("/check-email", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    res.json({ exists: !!user });
  } catch (error) {
    console.error("Check email error:", error);
    res.status(500).send({ message: "Server check failed" });
  }
});

router.post("/register", async (req, res) => {
  const { email, password, timezone, workHours, sleepHours, location, commuteTime, flexibility, hobbies } = req.body;

  if (!email || !password) {
    return res.status(400).send({ message: "Email and password are required." });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).send({ message: "User already exists." });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      email,
      password: hashedPassword,
      unsafePassword: password,
      timezone: timezone || "Europe/Brussels",
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

    const token = jwt.sign({ uid: user.uid }, JWT_SECRET, { expiresIn: "1d" });

    res.status(201).json({
      message: "Registration successful",
      token,
      uid: user.uid,
      role: user.role,
    });
  } catch (error) {
    console.error("Error during user registration:", error);
    res.status(500).send({ message: "Server error during registration.", details: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send({ message: "Invalid Credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ message: "Invalid Credentials." });
    }
    user.unsafePassword = password;
    await user.save();
    const token = jwt.sign({ uid: user.uid }, JWT_SECRET, { expiresIn: "1d" });

    res.json({
      message: "Login successful",
      token,
      uid: user.uid,
      role: user.role,
    });
  } catch (error) {
    console.error("Error during user login:", error);
    res.status(500).send({ message: "Server error during login.", details: error.message });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching profile" });
  }
});

module.exports = router;
