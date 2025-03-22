const mongoose = require("mongoose");
const UserProfile = require("../Models/UserProfile");
const User = require("../Models/User");
const isValidObjectId = mongoose.Types.ObjectId.isValid;
const axios = require("axios");
const Tag = require("../Models/TagUserTrack.js");

// Function to generate avatar based on initials
function generateImageUrl(name, color) {
  if (!name) return "";
  const words = name.split(" ");
  const initials =
    words.length >= 2
      ? words[0][0].toUpperCase() + words[1][0].toUpperCase()
      : words[0][0].toUpperCase();

  return `https://ui-avatars.com/api/?name=${initials}&background=${color}&color=fff`;
}

// Get all user Profiles
exports.getAllUserProfile = async (req, res) => {
  try {
    const users = await UserProfile.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// get user Profile by UserName
exports.getUserProfileByusername = async (req, res) => {
  try {
    const username = req.params.username;

    // Find the user by username
    // const userProfile = await UserProfile.findOne({ username });

    // Find the user profile by username and select only the required fields
    const userProfile = await UserProfile.findOne({ username })
      .select(
        "name bio username tags LinkedInUrl Githubusername noOfQuestions Graduation noOfAnswers avgRating totalPoints questionIds answerIds achievements followers following noOfFollowers noOfFollowing imageUrl"
      )
      .lean(); // Use lean() for a plain JavaScript object (better performance)

    // Check if the user profile exists
    if (!userProfile) {
      return res.status(404).json({ message: "User Profile not found" });
    }

    // Destructure and exclude the _id field
    const { _id, ...userProfileWithoutId } = userProfile;

    // Send the filtered user profile
    res.status(200).json(userProfileWithoutId);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single user Profile by ID
exports.getUserProfileById = async (req, res) => {
  try {
    const userid = req.user.userId;
    const clgemail = req.user.loginemail;

    if (!mongoose.Types.ObjectId.isValid(userid)) {
      return res.status(400).json({ error: "Invalid user ID format." });
    }

    const userprofile = await UserProfile.findOne({ userid: userid });

    if (!userprofile) {
      return res.status(404).json({ message: "UserProfile not found" });
    }

    res.json(userprofile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new user profile
exports.createUserProfile = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userid = req.user.userId;
    const loginemail = req.user.loginemail;

    if (!userid) return res.status(400).json({ error: "User ID is required." });
    if (!mongoose.Types.ObjectId.isValid(userid))
      return res.status(400).json({ error: "Invalid user ID format." });

    const user = await User.findById(userid).session(session);
    if (!user) return res.status(404).json({ error: "User not found." });

    const {
      name,
      bio,
      tags,
      LinkedInUrl,
      githubUsername,
      useGithubAvatar,
      Graduation,
      backupemail,
    } = req.body;

    if (tags && tags.length > 3) {
      return res.status(400).json({
        error: "You can only have up to 3 tags.",
        yourTags: tags,
        length: tags.length,
      });
    }

    // Ensure LinkedInUrl, githubUsername, and backupemail are unique
    if (LinkedInUrl) {
      const existingLinkedIn = await UserProfile.findOne({
        LinkedInUrl,
      }).session(session);
      if (existingLinkedIn)
        return res.status(400).json({ error: "LinkedIn URL already in use." });
    }

    if (githubUsername) {
      const existingGithub = await UserProfile.findOne({
        githubUsername,
      }).session(session);
      if (existingGithub)
        return res
          .status(400)
          .json({ error: "GitHub username already in use." });

      // Fetch GitHub Data (Public Repos & Avatar)
      try {
        const githubResponse = await axios.get(
          `https://api.github.com/users/${githubUsername}`
        );
        var githubPublicRepos = githubResponse.data.public_repos;
        var githubAvatarUrl = githubResponse.data.avatar_url;
      } catch (githubError) {
        return res
          .status(400)
          .json({ error: "Invalid GitHub username or API request failed." });
      }
    }

    if (backupemail) {
      const existingBackupEmail = await UserProfile.findOne({
        backupemail,
      }).session(session);
      if (existingBackupEmail)
        return res.status(400).json({ error: "Backup email already in use." });
    }
    const avatarColor = Math.floor(Math.random() * 16777215).toString(16);
    const imageUrl =
      useGithubAvatar && githubAvatarUrl
        ? githubAvatarUrl
        : generateImageUrl(name, avatarColor);

    const userProfileData = {
      userid,
      name,
      username: user.username,
      clgemail: loginemail,
      bio,
      tags,
      LinkedInUrl,
      avatarColor,
      useGithubAvatar: !!useGithubAvatar,
      githubUsername,
      githubPublicRepos: githubPublicRepos || 0,
      githubAvatarUrl: githubAvatarUrl || "",
      Graduation,
      backupemail,
      imageUrl,
    };

    // Save the profile
    const userProfile = new UserProfile(userProfileData);
    await userProfile.save({ session });

    if (tags && tags.length > 0) {
      for (const tag of tags) {
        await Tag.findOneAndUpdate(
          { tagName: tag }, // Check if tag exists
          { $addToSet: { users: userid } }, // Add user if not already added
          { upsert: true, session, new: true } // Create tag if not exists
        );
      }
    }

    // Mark user profile as completed
    user.isProfileCompleted = true;
    await user.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    res
      .status(201)
      .json({ message: "User profile created successfully!", userProfile });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: err.message });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userid = req.user.userId;
    if (!userid) return res.status(400).json({ error: "User ID is required." });

    const {
      name,
      bio,
      LinkedInUrl,
      githubUsername,
      Graduation,
      useGithubAvatar,
    } = req.body;

    const changeableFields = {
      name,
      bio,
      LinkedInUrl,
      githubUsername,
      Graduation,
      useGithubAvatar,
    };

    // Remove undefined fields
    Object.keys(changeableFields).forEach((key) => {
      if (changeableFields[key] === undefined) delete changeableFields[key];
    });

    if (Object.keys(changeableFields).length === 0) {
      return res.status(400).json({ error: "No valid fields to update." });
    }

    // Fetch the existing user profile
    const userProfile = await UserProfile.findOne({ userid }).session(session);
    if (!userProfile) {
      return res.status(404).json({ error: "User profile not found." });
    }

    // Check if GitHub username is updated and fetch new data
    if (githubUsername && githubUsername !== userProfile.githubUsername) {
      const existingGithub = await UserProfile.findOne({
        githubUsername,
      }).session(session);
      if (existingGithub)
        return res
          .status(400)
          .json({ error: "GitHub username already in use." });

      // Fetch GitHub Data
      try {
        const githubResponse = await axios.get(
          `https://api.github.com/users/${githubUsername}`
        );
        changeableFields.useGithubAvatar = useGithubAvatar;
        changeableFields.githubPublicRepos = githubResponse.data.public_repos;
        changeableFields.githubAvatarUrl = githubResponse.data.avatar_url;
      } catch (githubError) {
        console.error(
          "GitHub API Error:",
          githubError.response?.data || githubError.message
        );

        // Check if it's a rate limit issue
        if (
          githubError.response?.status === 403 &&
          githubError.response?.headers["x-ratelimit-remaining"] === "0"
        ) {
          return res.status(429).json({
            error: "GitHub API rate limit exceeded. Please try again later.",
            details: "Check GitHub API documentation for rate limits.",
          });
        }

        return res.status(400).json({
          error: "Invalid GitHub username or API request failed.",
          details: githubError.response?.data?.message || githubError.message,
        });
      }
    }
    // Update profile
    Object.assign(userProfile, changeableFields);
    await userProfile.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Remove _id from response
    const { _id, ...profileWithoutId } = userProfile.toObject();

    res.json({
      message: "Profile updated successfully",
      userProfile: profileWithoutId,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: err.message });
  }
};

//search by name and username
exports.searchUsers = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const searchRegex = new RegExp(query, "i"); // Case-insensitive search

    const users = await UserProfile.find(
      {
        $or: [
          { name: searchRegex },
          { username: searchRegex },
          { bio: searchRegex },
          { Graduation: searchRegex },
          { tags: searchRegex }, // Search inside the tags array
        ],
      },
      "userid name username bio Graduation tags imageUrl" // Include relevant fields
    )
      .sort({ name: 1 }) // Sort by name alphabetically
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({ results: users, total: users.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a user Profile by ID
exports.deleteUserProfile = async (req, res) => {
  try {
    const userid = req.user.userId;
    const loginemail = req.user.loginemail;
    const user = await UserProfile.findByIdAndDelete(userid);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUserTags = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tags: newTags } = req.body;

    const userProfile = await UserProfile.findOne({ userid: userId });

    if (!userProfile) {
      return res.status(404).json({ error: "User profile not found!" });
    }

    const now = new Date();
    const currentMonth = now.getFullYear() + "-" + (now.getMonth() + 1); // Format: YYYY-M
    const lastUpdateMonth = userProfile.lastTagUpdate
      ? userProfile.lastTagUpdate.getFullYear() +
        "-" +
        (userProfile.lastTagUpdate.getMonth() + 1)
      : null;

    // ✅ Ensure updates happen only on the 1st day of the month
    if (now.getDate() !== 1) {
      return res.status(403).json({
        error: "Tags can only be updated on the 1st day of each month.",
        lastUpdate: userProfile.lastTagUpdate, // Include last update date
      });
    }

    if (lastUpdateMonth === currentMonth) {
      return res.status(403).json({
        error: "You have already updated your tags this month.",
        lastUpdate: userProfile.lastTagUpdate, // Include last update date
      });
    }

    const oldTags = userProfile.tags || [];
    const tagsToRemove = oldTags.filter((tag) => !newTags.includes(tag));
    const tagsToAdd = newTags.filter((tag) => !oldTags.includes(tag));

    const session = await UserProfile.startSession();
    session.startTransaction();

    try {
      await Tag.updateMany(
        { tagName: { $in: tagsToRemove } },
        { $pull: { users: userId } },
        { session }
      );

      for (const tag of tagsToAdd) {
        await Tag.findOneAndUpdate(
          { tagName: tag },
          { $addToSet: { users: userId } },
          { upsert: true, session, new: true }
        );
      }

      userProfile.tags = newTags;
      userProfile.lastTagUpdate = new Date();
      await userProfile.save({ session });

      await session.commitTransaction();
      session.endSession();
      res.json({
        message: "Tags updated successfully!",
        tags: newTags,
        lastUpdate: userProfile.lastTagUpdate, // Return updated timestamp
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ error: "Internal server error!" });
  }
};
