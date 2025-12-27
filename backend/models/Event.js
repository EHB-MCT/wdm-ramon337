const mongoose = require('mongoose');

/**
 * Event Schema
 * Used to store surveillance logs, user interactions, and inferred locations.
 * This collection builds the "Shadow Profile" of the user.
 */
const EventSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true 
  },
  eventType: { 
    type: String, 
    required: true // e.g., 'click', 'drag_start', 'page_view'
  },
  eventData: { 
    type: Object // Flexible structure to store any metadata captured
  },
  location: { 
    type: String, 
    default: "" // Inferred physical location (e.g., "Office", "Home")
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Event', EventSchema);