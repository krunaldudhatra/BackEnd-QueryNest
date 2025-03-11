const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const server = express();
const startCleanupJob = require("./cleanup"); // Import the cleanup function
require("dotenv").config();
server.use(express.json());
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

const UserProfileRoutes = require("./Routes/UserProfileRoutes");
const UserRoutes = require("./Routes/UserRoutes");
const AnswerRoutes = require("./Routes/AnswerRoutes");
const QuestionRoutes = require("./Routes/QuestionRoutes");
const PointCalculationRoutes = require("./Routes/PointCalculationRoutes");
const TagUseTrackRoutes = require("./Routes/TagUserTrackRoutes");
const TagDetailsRoutes = require("./Routes/TagDetailsRoutes");
const OverallLeaderBoardRoutes = require("./Routes/OverallLeaderBoardRoutes");
const TagLeaderBoardRoutes = require("./Routes/TagLeaderBoardRoutes");

server.use(
  cors({
    origin: "*", // Allow your frontend origin
    methods: "GET,POST,PUT,DELETE", // Allowed request methods
    credentials: true, // Allow cookies and headers
  })
);

// Middleware
server.use("/api/UserProfile", UserProfileRoutes);
server.use("/api/User", UserRoutes);
server.use("/api/Answer", AnswerRoutes);
server.use("/api/Question", QuestionRoutes);
server.use("/api/Pointcalculation", PointCalculationRoutes);
server.use("/api/TagUserTrack", TagUseTrackRoutes);
server.use("/api/TagDetailsRoutes", TagDetailsRoutes);
server.use("/api/OverallLeaderBoardRoutes", OverallLeaderBoardRoutes);
server.use("/api/TagLeaderBoardRoutes", TagLeaderBoardRoutes);

// MongoDB Connection
// mongoose
//   .connect("mongodb://localhost:27017/QueryNest")
//   .then(() => console.log("MongoDB connected on port 27017"))
//   .catch((err) => console.error("MongoDB connection error:", err));

// Connect to MongoDB to global

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully!");
  })
  .catch((err) => console.log("Failed to connect to MongoDB:", err));
  

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = server;
