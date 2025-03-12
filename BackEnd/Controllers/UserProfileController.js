const mongoose = require("mongoose");
const UserProfile = require("../Models/UserProfile");
const User = require("../Models/User");
const isValidObjectId = mongoose.Types.ObjectId.isValid;

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

    // Find the user profile by user ID and select only the required fields
    // Find the user profile by username and select only the required fields
    const userProfile = await UserProfile.findOne({ username })
      .select(
        "bio username tags LinkedInusername Githubusername noOfQuestions Graduation noOfAnswers avgRating totalPoints questionIds answerIds achievements followers following noOfFollowers noOfFollowing imageUrl"
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
    const clgemail = req.user.email;
    const user = await UserProfile.findById(userid);

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// create profile for registered user
exports.createUserProfile = async (req, res) => {
  const userid = req.user.userId;
  const loginemail = req.user.email;
  try {
    const {
      bio,
      tags,
      LinkedInusername,
      Githubusername,
      Graduation,
      backupemail,
    } = req.body;

    // Validate required fields
    if (!userid) return res.status(400).json({ error: "User ID is required." });
    if (!isValidObjectId(userid))
      return res.status(400).json({ error: "Invalid user ID format." });

    // Validate if the user exists
    const user = await User.findOne({ _id: userid });
    if (!user) return res.status(404).json({ error: "User not found." });

    const username = user.username;

    // Validate `tags` length
    if (tags && tags.length > 3) {
      return res.status(400).json({ error: "You can only have up to 3 tags." });
    }

    // Check if LinkedIn and GitHub usernames are unique
    const existingProfile = await UserProfile.findOne({
      $or: [{ LinkedInusername }, { Githubusername }],
    });

    if (existingProfile) {
      return res
        .status(400)
        .json({ error: "LinkedIn or GitHub username is already in use." });
    }

    // Check if backup email is already taken
    if (backupemail) {
      const existingBackupEmail = await UserProfile.findOne({ backupemail });
      if (existingBackupEmail) {
        return res
          .status(400)
          .json({ error: "Backup email is already in use." });
      }
    }

    // Create user profile
    const userProfileData = {
      userid,
      username,
      clgemail:loginemail,
      bio,
      tags,
      LinkedInusername,
      Githubusername,
      Graduation,
      backupemail,
    };

    const userProfile = new UserProfile(userProfileData);
    await userProfile.save();
    user.isProfileCompleted=true;
     await user.save();  

    res
      .status(201)
      .json({ message: "User profile created successfully!", userProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

 // Update a user profile by ID
exports.updateUserProfile = async (req, res) => {
  try {
    const userid = req.user.userId; // Extract user ID from the authenticated request
    const loginemail = req.user.email; // Extract email from the authenticated request

    const { username, bio, LinkedInusername, Githubusername, Graduation } =
      req.body;

    // Define the fields that can be updated
    const changeableFields = {
      username,
      bio,
      LinkedInusername,
      Githubusername,
      Graduation,
    };

    // Remove undefined fields
    Object.keys(changeableFields).forEach((key) => {
      if (changeableFields[key] === undefined) {
        delete changeableFields[key];
      }
    });

    // If no valid fields to update, return an error
    if (Object.keys(changeableFields).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    // Find the existing user profile
    const userProfile = await UserProfile.findOne({ userid });

    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found" });
    }

    // Update only if fields are provided
    Object.assign(userProfile, changeableFields);

    // If the username is updated, also update in the User schema
    if (username) {
      await User.findByIdAndUpdate(userid, { username });
    }

    // Save the updated profile (this won’t create a new object)
    await userProfile.save();

    // Remove _id from the response (optional)
    const { _id, ...profileWithoutId } = userProfile.toObject();

    res.json({
      message: "Profile updated successfully",
      userProfile: profileWithoutId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a user Profile by ID
exports.deleteUserProfile = async (req, res) => {
  try {
    const userid = req.user.userId;
    const loginemail = req.user.email;
    const user = await UserProfile.findByIdAndDelete(userid);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
