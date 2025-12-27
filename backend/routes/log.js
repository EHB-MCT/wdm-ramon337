const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth"); // Consistent naming with other files
const Event = require("../models/Event");

/**
 * @route   POST /api/log/event
 * @desc    Log user interactions (clicks, drags, page views) for surveillance.
 * This feeds the "Shadow Profile".
 * @access  Private
 */
router.post("/event", verifyToken, async (req, res) => {
  try {
    // 1. Extract Data
    // We accept 'eventData' (standard) or 'payload' (fallback) to be flexible with frontend
    const { eventType, eventData, payload, location } = req.body;

    if (!eventType) {
      return res.status(400).json({ message: "Missing eventType." });
    }

    // 2. Create Event Document
    // ⚠️ CRITICAL: Fields must match backend/models/Event.js
    const newEvent = new Event({
      userId: req.user.uid,       // Model expects 'userId', not 'uid'
      eventType: eventType,
      eventData: eventData || payload || {}, // Map input to 'eventData'
      location: location || "",   // Optional: inferred location
      timestamp: new Date()
    });

    // 3. Save to Database
    await newEvent.save();

    res.status(201).json({ 
      message: "Event logged successfully", 
      eventId: newEvent._id 
    });
    
  } catch (error) {
    console.error("Logging Error:", error.message);
    res.status(500).json({ message: "Failed to log event." });
  }
});

module.exports = router;