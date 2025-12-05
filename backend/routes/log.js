const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Event = require("../models/Event"); // Imports the Event Model

router.post("/event", authMiddleware, async (req, res) => {
  try {
    const uid = req.user.uid;

    const { eventType, meta, payload } = req.body;

    if (!eventType || !payload) {
      return res.status(400).json({ message: "Missing eventType or payload." });
    }

    const newEvent = new Event({
      uid,
      eventType,
      meta: meta || {},
      payload,
    });

    await newEvent.save();

    res.status(201).json({
      message: "Event logged successfully",
      eventId: newEvent._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to log event.", error: error.message });
  }
});

module.exports = router;
