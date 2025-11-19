// backend/models/User.js

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toHexString(), 
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  timezone: {
    type: String,
    default: 'Europe/Brussels',
  },
  initialPreferences: {
    workHours: { type: Number, default: 40 },
    sleepHours: { type: Number, default: 8 },
    flexibilityGoal: { type: Number, default: 5 }, 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);