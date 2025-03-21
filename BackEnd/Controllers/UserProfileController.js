const mongoose = require("mongoose");
const UserProfile = require("../Models/UserProfile");
const User = require("../Models/User");
const isValidObjectId = mongoose.Types.ObjectId.isValid;
const axios = require("axios");

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
        "bio username tags LinkedInUrl Githubusername noOfQuestions Graduation noOfAnswers avgRating totalPoints questionIds answerIds achievements followers following noOfFollowers noOfFollowing imageUrl"
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
      const existingGithub = await UserProfile.findOne({githubUsername}).session(session);
      if (existingGithub)
        return res.status(400).json({ error: "GitHub username already in use." });

      // Fetch GitHub Data (Public Repos & Avatar)
      try {
        const githubResponse = await axios.get(`https://api.github.com/users/${githubUsername}`);
        var githubPublicRepos = githubResponse.data.public_repos;
        var githubAvatarUrl = githubResponse.data.avatar_url;
      } catch (githubError) {
        return res.status(400).json({ error: "Invalid GitHub username or API request failed." });
      }
    }

    if (backupemail) {
      const existingBackupEmail = await UserProfile.findOne({backupemail}).session(session);
      if (existingBackupEmail)
        return res.status(400).json({ error: "Backup email already in use." });
    }
    const avatarColor = Math.floor(Math.random() * 16777215).toString(16);
    const imageUrl = useGithubAvatar && githubAvatarUrl
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

    // Mark user profile as completed
    user.isProfileCompleted = true;
    await user.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: "User profile created successfully!", userProfile });
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

    const { name, bio, LinkedInUrl, githubUsername, Graduation , useGithubAvatar } = req.body;

    const changeableFields = {
      name,
      bio,
      LinkedInUrl,
      githubUsername,
      Graduation,
      useGithubAvatar
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
        changeableFields.githubPublicRepos = githubResponse.data.public_repos;
        changeableFields.githubAvatarUrl = githubResponse.data.avatar_url;
      } catch (githubError) {
        return res
          .status(400)
          .json({ error: "Invalid GitHub username or API request failed." });
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
