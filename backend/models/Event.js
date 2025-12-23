const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  eventType: { type: String, required: true },
  eventData: { type: Object },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);