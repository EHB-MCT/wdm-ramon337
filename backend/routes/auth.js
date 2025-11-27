const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = "RamonDev5";

// --- POST /api/auth/register ---
router.post("/register", async (req, res) => {});

// --- POST /api/auth/login ---
router.post("/login", async (req, res) => {});

module.exports = router; // 👈 CRUCIAAL voor de fix
