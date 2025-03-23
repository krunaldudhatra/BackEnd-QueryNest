const Leaderboard = require("../Models/OverallLeaderboard"); // ✅ Ensure correct path
const UserProfile = require("../Models/UserProfile");
const User = require("../Models/User"); // ✅ Import User model
const mongoose = require("mongoose");
const TagDetail = require("../Models/TagDetails"); // ✅ Import TagDetail model

// ✅ Generate both overall and tag-wise leaderboards
exports.generateAllLeaderboards = async (req, res) => {
  try {
    let { month, year } = req.body;
    const currentDate = new Date();
    month = month || currentDate.getMonth() + 1;
    year = year || currentDate.getFullYear();

    // ✅ Fetch all users with their points and tags
    const users = await UserProfile.find({}, "userid totalPoints tags")
      .populate("userid", "name username imageUrl") // ✅ Ensure correct reference to User
      .exec();

    if (!users.length) {
      return res.status(404).json({ error: "No users found." });
    }

    // ✅ Convert tag names to ObjectIds
    const tagMap = {};
    const tagNames = [...new Set(users.flatMap(user => user.tags))];

    if (tagNames.length > 0) {
      const tags = await TagDetail.find({ name: { $in: tagNames } }, "_id name");
      tags.forEach(tag => {
        tagMap[tag.name] = tag._id;
      });
    }

    // ✅ Format overall leaderboard users
    const overallLeaderboardUsers = users.map((user) => ({
      userId: user.userid._id,
      points: user.totalPoints || 0,
      tags: user.tags.map(tagName => tagMap[tagName] || null).filter(tagId => tagId !== null), // Convert to ObjectIds
    }));

    // ✅ Sort users by points in descending order
    overallLeaderboardUsers.sort((a, b) => b.points - a.points);

    // ✅ Assign ranks
    overallLeaderboardUsers.forEach((user, index) => {
      user.rank = index + 1;
    });

    // ✅ Upsert overall leaderboard
    await Leaderboard.findOneAndUpdate(
      { "time.month": month, "time.year": year, type: "overall" },
      { $set: { time: { month, year }, type: "overall", users: overallLeaderboardUsers } },
      { upsert: true, new: true }
    );

    // ✅ Generate tag-wise leaderboards
    for (const tagName of tagNames) {
      const tagId = tagMap[tagName];

      // ✅ Filter users for this specific tag
      const tagUsers = users
        .filter(user => user.tags.includes(tagName))
        .map(user => ({
          userId: user.userid._id,
          points: user.totalPoints || 0,
        }));

      // ✅ Sort users by points for this tag
      tagUsers.sort((a, b) => b.points - a.points);

      // ✅ Assign ranks for tag leaderboard
      tagUsers.forEach((user, index) => {
        user.rank = index + 1;
      });

      // ✅ Upsert tag-wise leaderboard
      await Leaderboard.findOneAndUpdate(
        { "time.month": month, "time.year": year, type: "tag-wise", tagId },
        { $set: { time: { month, year }, type: "tag-wise", tagId, users: tagUsers } },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({ message: "All leaderboards updated successfully" });
  } catch (error) {
    console.error("Error generating leaderboards:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Fetch leaderboard (overall or tag-wise)
// ✅ Fetch leaderboard (overall or tag-wise)
exports.getLeaderboard = async (req, res) => {
  try {
    let { month, year, tagName } = req.query;
    console.log("Received tagName:", tagName);

    const currentDate = new Date();
    month = month || currentDate.getMonth() + 1;
    year = year || currentDate.getFullYear();

    let tagId = null;

    // ✅ If tagName is provided, fetch the corresponding tagId (Case Insensitive)
    if (tagName) {
      const tag = await TagDetail.findOne({ tagName: new RegExp(`^${tagName}$`, "i") }, "_id");
      
      console.log("Tag search result:", tag);

      if (!tag) {
        return res.status(404).json({ error: "Tag not found." });
      }
      tagId = tag._id;
    }

    // ✅ Build query filter
    const filter = {
      "time.month": month,
      "time.year": year,
      type: tagId ? "tag-wise" : "overall",
    };
    if (tagId) filter.tagId = tagId;

    // ✅ Fetch leaderboard (either overall or tag-wise)
    let leaderboard = await Leaderboard.findOne(filter)
      .populate({
        path: "users.userId",
        select: "name username imageUrl",
        model: "User", // ✅ Ensure correct model reference
      })
      .exec();

    if (!leaderboard) {
      return res.status(404).json({ error: "Leaderboard not found for this month and year." });
    }

    let users = leaderboard.users;

    // ✅ Sort users by points (descending)
    users.sort((a, b) => b.points - a.points);

    // ✅ Assign ranks
    users = users.map((user, index) => ({
      rank: index + 1,
      userId: user.userId._id,
      name: user.userId.name,
      username: user.userId.username,
      imageUrl: user.userId.imageUrl,
      points: user.points,
    }));

    res.status(200).json({ leaderboard: users });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
