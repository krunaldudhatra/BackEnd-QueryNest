const mongoose = require("mongoose");

const LeaderboardSchema = new mongoose.Schema(
  {
    time: {
      month: { type: Number, required: true },
      year: { type: Number, required: true },
    },
    type: {
      type: String,
      enum: ["overall", "tag-wise"],
      required: true,
    },
    tagId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TagDetail",
      required: function () {
        return this.type === "tag-wise"; // ✅ Required only for tag-wise leaderboard
      },
    },
    users: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserDetails", required: true },
        points: { type: Number, default: 0 },
        rank: { type: Number },
        tags: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TagDetail",
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Leaderboard", LeaderboardSchema);
