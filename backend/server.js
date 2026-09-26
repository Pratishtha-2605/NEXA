require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Experiment routes
const experimentRoutes = require("./routes/experiments");
app.use("/api/experiments", experimentRoutes);

// Test route
app.get("/", (req, res) => {
    res.send("NEXA Backend is running!");
});

// MongoDB connection
mongoose
    .connect(process.env.MONGO_URI)
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