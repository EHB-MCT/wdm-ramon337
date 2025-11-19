const express = require("express");
const mongoose = require("mongoose");
const app = express();

app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 8080;

// DATABASE CONNECTION
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");

    // START SERVER WHEN DB IS CONNECTED
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    // DB FAILED CONNECTION
    process.exit(1);
  });

// GET-route
app.get("/", (req, res) => {
  res.send("Planner API is running and connected to MongoDB!");
});
