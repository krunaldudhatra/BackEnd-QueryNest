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

// Get a single user Profile by ID
exports.getUserProfileById = async (req, res) => {
  try {
    const user = await UserProfile.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// create profile for registered user
exports.createUserProfile = async (req, res) => {
  try {
    const {
      userid,
      clgemail,
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
    const user = await User.findOne({ _id: userid, clgemail });
    if (!user) return res.status(404).json({ error: "User not found." });

    // Validate `tags` length
    if (tags && tags.length > 3) {
      return res.status(400).json({ error: "You can only have up to 3 tags." });
    }

    // Check if LinkedIn and GitHub usernames are unique
    const existingProfile = await UserProfile.findOne({
      $or: [{ LinkedInusername }, { Githubusername },{clgemail},{backupemail}],
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
        clgemail,
        bio,
        tags,
        LinkedInusername,
        Githubusername,
        Graduation,
        backupemail
    };

    const userProfile = new UserProfile(userProfileData);
    await userProfile.save();

     

    res.status(201).json({ message: "User profile created successfully!", userProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a user Profile by ID
exports.updateUserProfile = async (req, res) => {
  try {
    const { clgemail, backupemail, bio, LinkedInusername, Githubusername, Graduation, imageUrl } = req.body;

    if (!clgemail) {
      return res.status(400).json({ error: "College email is required to update profile" });
    }

    // Define the fields that can be updated
    const changeableFields = {
      backupemail,
      bio,
      LinkedInusername,
      Githubusername,
      Graduation,
      imageUrl,
    };

    // Remove undefined fields
    Object.keys(changeableFields).forEach((key) => {
      if (changeableFields[key] === undefined) {
        delete changeableFields[key];
      }
    });

    if (Object.keys(changeableFields).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    // Find the user profile by clgemail and update
    const userProfile = await UserProfile.findOneAndUpdate(
      { clgemail },
      changeableFields,
      { new: true, runValidators: true }
    );

    if (!userProfile) return res.status(404).json({ message: "User profile not found" });

    res.json({ message: "Profile updated successfully", userProfile });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a user Profile by ID
exports.deleteUserProfile = async (req, res) => {
  try {
    const user = await UserProfile.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
