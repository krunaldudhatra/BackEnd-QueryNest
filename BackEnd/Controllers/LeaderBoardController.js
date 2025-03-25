const Leaderboard = require("../Models/Leaderboard"); // ✅ Ensure correct path
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

    // ✅ Convert tag names to a unique list (no need for ObjectId conversion)
    const tagNames = [...new Set(users.flatMap(user => user.tags))];

    // ✅ Fetch tags from the TagDetail collection
    const tags = await TagDetail.find({ tagName: { $in: tagNames } });
    const tagMap = tags.reduce((map, tag) => {
      map[tag.tagName] = tag._id;
      return map;
    }, {});

    // ✅ Format overall leaderboard users
    const overallLeaderboardUsers = users.map((user) => ({
      userId: user.userid._id,
      points: user.totalPoints || 0,
      tags: user.tags.map(tagName => tagMap[tagName] || null).filter(tagId => tagId !== null), // Convert to ObjectIds
    }));

    // ✅ Sort users by points in descending order
    overallLeaderboardUsers.sort((a, b) => b.points - a.points);

    // ✅ Assign ranks for overall leaderboard
    overallLeaderboardUsers.forEach((user, index) => {
      user.rank = index + 1;
    });

    // ✅ Check if overall leaderboard exists for the given month and year
    const existingOverallLeaderboard = await Leaderboard.findOne({
      "time.month": month,
      "time.year": year,
      type: "overall",
    });

    let overallLeaderboard;
    if (existingOverallLeaderboard) {
      // ✅ If it exists, update it
      existingOverallLeaderboard.users = overallLeaderboardUsers;
      overallLeaderboard = await existingOverallLeaderboard.save();
    } else {
      // ✅ If it doesn't exist, create a new one
      const newOverallLeaderboard = new Leaderboard({
        time: { month, year },
        type: "overall",
        users: overallLeaderboardUsers,
      });
      overallLeaderboard = await newOverallLeaderboard.save();
    }

    // ✅ Prepare an array for tag-wise leaderboards
    let tagwiseLeaderboards = [];

    // ✅ Generate tag-wise leaderboards for each tag
    for (const tagName of tagNames) {
      const tagId = tagMap[tagName]; // Use the ObjectId for the tag

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

      // ✅ Check if tag-wise leaderboard exists for the given month and year
      const existingTagLeaderboard = await Leaderboard.findOne({
        "time.month": month,
        "time.year": year,
        type: "tag-wise",
        tagId, // Use tagId as a reference
      });

      let tagLeaderboard;
      if (existingTagLeaderboard) {
        // ✅ If it exists, update it
        existingTagLeaderboard.users = tagUsers;
        tagLeaderboard = await existingTagLeaderboard.save();
      } else {
        // ✅ If it doesn't exist, create a new one
        const newTagLeaderboard = new Leaderboard({
          time: { month, year },
          type: "tag-wise",
          tagId, // Use tagId as a reference
          users: tagUsers,
        });
        tagLeaderboard = await newTagLeaderboard.save();
      }

      // ✅ Add the tag leaderboard to the response array along with the tag name
      tagwiseLeaderboards.push({
        tagName: tagName,
        leaderboard: tagLeaderboard,
      });
    }

    // ✅ Send both overall and tag-wise leaderboards in the response
    res.status(200).json({
      message: "Leaderboards generated successfully",
      overallLeaderboard: overallLeaderboard,
      tagwiseLeaderboards: tagwiseLeaderboards,
    });

  } catch (error) {
    console.error("Error generating leaderboards:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// ✅ Get leaderboard based on month, year, and optional tagName query

exports.getLeaderboard = async (req, res) => {
  try {
    let { month, year, tagName } = req.query;
    const currentDate = new Date();

    if (!month || !year) {
      year = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
      month = currentDate.getMonth() === 0 ? 12 : currentDate.getMonth();
    }

    let tagId = null;
    if (tagName) {
      const tag = await TagDetail.findOne({ tagName });
      if (tag) {
        tagId = tag._id;
      } else {
        return res.status(404).json({ error: "Tag not found." });
      }
    }

    let leaderboard;
    if (!tagId) {
      leaderboard = await Leaderboard.findOne({
        "time.month": month,
        "time.year": year,
        type: "overall",
      });
    } else {
      leaderboard = await Leaderboard.findOne({
        "time.month": month,
        "time.year": year,
        type: "tag-wise",
        tagId,
      });
    }

    if (!leaderboard) {
      return res.status(404).json({ error: "Leaderboard not found for the given criteria." });
    }

    // ✅ Fetch user profile details (name, username, imageUrl)
    const enrichedLeaderboard = await Promise.all(
      leaderboard.users.map(async (user) => {
        const profile = await UserProfile.findOne({ userid: user.userId });
        return {
          ...user.toObject(),
          name: profile?.name || "Unknown",
          username: profile?.username || "unknown_user",
          imageUrl: profile?.imageUrl || "",
        };
      })
    );

    return res.status(200).json({
      message: tagId
        ? `Tag-wise leaderboard for ${tagName} retrieved successfully`
        : "Overall leaderboard retrieved successfully",
      leaderboard: enrichedLeaderboard,
    });

  } catch (error) {
    console.error("Error retrieving leaderboard:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.getTopUsers = async (req, res) => {
  try {
    const users = await UserProfile.find({}, "name username imageUrl totalPoints")
      .sort({ totalPoints: -1 }) // Sort in descending order
      .exec();

    if (!users.length) {
      return res.status(404).json({ error: "No users found." });
    }

    res.status(200).json({
      message: "Users sorted by points retrieved successfully",
      users,
    });
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
