const express = require("express");
const router = express.Router();
const { 
    
    getLeaderboard,
    generateAllLeaderboards} = require("../Controllers/OverallLeaderBoardController");

// ✅ Route to generate & store leaderboard
router.post("/generate", generateAllLeaderboards);

router.get("/",getLeaderboard);

module.exports = router;
