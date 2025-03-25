const express = require("express");
const router = express.Router();
const { 
    
    getLeaderboard,
    generateAllLeaderboards,getTopUsers} = require("../Controllers/LeaderBoardController");

// ✅ Route to generate & store leaderboard
router.post("/generate", generateAllLeaderboards);
router.get("/gettopusers",getTopUsers);
router.get("/",getLeaderboard);

module.exports = router;
