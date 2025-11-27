const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const logRoutes = require("./routes/log");
const authRoutes = require("./routes/auth");
const app = express();

const corsOptions = {
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};
app.use(cors(corsOptions));

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

app.use("/api/auth", authRoutes);
app.use("/api/log", logRoutes);

// GET-route
app.get("/", (req, res) => {
  res.send("Planner API is running and connected to MongoDB!");
});
