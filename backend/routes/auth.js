const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = "RamonDev5";

// --- POST /api/auth/register ---
router.post("/register", async (req, res) => {
  const { email, password, timezone, workHours, sleepHours } = req.body;

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
      timezone: timezone || "Europe/Brussels",
      initialPreferences: { workHours, sleepHours },
    });

    await user.save();

    const token = jwt.sign({ uid: user.uid }, JWT_SECRET, { expiresIn: "1d" });

    res.status(201).json({
      message: "Registration successful",
      token,
      uid: user.uid,
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

    // 1. Controleer het wachtwoord
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ message: "Invalid Credentials." });
    }

    // 2. Genereer een nieuwe JWT met de UID
    const token = jwt.sign({ uid: user.uid }, JWT_SECRET, { expiresIn: "1d" });

    res.json({
      message: "Login successful",
      token,
      uid: user.uid,
    });
  } catch (error) {
    console.error("Error during user login:", error);
    res.status(500).send({ message: "Server error during login.", details: error.message });
  }
});

module.exports = router;
