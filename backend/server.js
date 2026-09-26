require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const experimentRoutes = require("./routes/experiments");
const responseRoutes = require("./routes/response");

app.use("/api/experiments", experimentRoutes);
app.use("/api/responses", responseRoutes);

// Health / test routes
app.get("/", (req, res) => {
  res.send("NEXA Backend is running!");
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// MongoDB connection
// Supports either MONGO_URI or MONGODB_URI so whichever .env key either of
// you already has locally keeps working — but agree on ONE name going
// forward (see note below) so your .env.example doesn't confuse people.
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("MongoDB connected successfully!");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});