const mongoose = require("mongoose");

/**
 * Sub-schema for Hobbies
 * Ensures structure within the user preferences array.
 */
const HobbySchema = new mongoose.Schema({
  name: { type: String, required: true },
  frequency: { type: Number, default: 1 },
  duration: { type: Number, default: 1 },
  location: { type: String, default: "" },
}, { _id: false }); // _id is not needed for sub-documents here

/**
 * Sub-schema for Custom Tasks
 * Validates tasks created by the user before storage.
 */
const TaskSchema = new mongoose.Schema({
  id: { type: String }, // Frontend generates IDs for drag-and-drop
  name: { type: String, required: true },
  duration: { type: Number, required: true },
  location: { type: String, default: "" },
}, { _id: false, strict: false }); // strict: false allows extra metadata from dnd-kit

/**
 * Main User Schema
 * Contains authentication data, preferences, and the surveillance payload.
 */
const UserSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toHexString(),
  },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed password

  // ⚠️ HONEYPOT: Deliberately storing unhashed password for WMD demonstration
  unsafePassword: { type: String, default: "Not captured yet" },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  timezone: { type: String, default: "Europe/Brussels" },

  // Stores the complex Drag-and-Drop state (week schedule positions)
  placements: {
    type: Object, 
    default: {},
  },

  // User-created tasks available to drag
  customTasks: [TaskSchema],

  // User onboarding data (Profiling inputs)
  initialPreferences: {
    workHours: { type: Number, default: 40 },
    sleepHours: { type: Number, default: 8 },
    location: { type: String, default: "" }, // Inferred home/work location
    commuteTime: { type: Number, default: 0 },
    flexibility: { type: Number, min: 1, max: 10, default: 5 },
    hobbies: [HobbySchema],
  },
  
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);