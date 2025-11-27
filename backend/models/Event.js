const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  // UID
  uid: {
    type: String,
    required: true,
    index: true,
  },
  // Type of action (ex. 'TASK_MOVED', 'HOVER', ...)
  eventType: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  meta: {
    type: Object,
  },
  payload: {
    type: Object,
    required: true,
  },
});

module.exports = mongoose.model("Event", EventSchema);
