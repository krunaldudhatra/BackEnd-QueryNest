const mongoose = require("mongoose");

const LeaderboardSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    time: {
      month: { type: Number, required: true },
      year: { type: Number, required: true },
    },
    users: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserDetails", required: true },
        points: { type: Number, default: 0 },
        rank: { type: Number },
        tags: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "TagDetail",
          }],
      },
    ],
   
  },
  { timestamps: true }
);

module.exports = mongoose.model("Leaderboard", LeaderboardSchema);
