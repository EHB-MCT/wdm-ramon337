const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toHexString(),
  },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // De honeypot voor het wachtwoord
  unsafePassword: { type: String, default: "Not captured yet" },

  role: {
    type: String,
    default: "user",
    enum: ["user", "admin"],
  },
  timezone: { type: String, default: "Europe/Brussels" },

  // Opslag voor het rooster
  placements: {
    type: Object,
    default: {},
  },
  customTasks: {
    type: Array, 
    default: [] 
  },

  initialPreferences: {
    workHours: { type: Number, default: 40 },
    sleepHours: { type: Number, default: 8 },
    location: { type: String, default: "" },
    commuteTime: { type: Number, default: 0 },
    flexibility: { type: Number, min: 1, max: 10, default: 5 },

    hobbies: [
      {
        name: { type: String },
        frequency: { type: Number },
        duration: { type: Number, default: 1 },
        location: { type: String, default: "" },
      },
    ],
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
