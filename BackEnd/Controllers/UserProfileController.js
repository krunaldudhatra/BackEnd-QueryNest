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
  console.log("hello")

  try {
    console.log("hello")
    const userid = new mongoose.Types.ObjectId(req.user.userId)
    const clgemail = req.user.loginemail;
    const userprofile = await UserProfile.findOne({userid:userid});
     console.log(userid)
     console.log(clgemail)
    if (!userprofile) return res.status(404).json({ message: "UserProfile not found" });
    res.json(userprofile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// create profile for registered user
// exports.createUserProfile = async (req, res) => {
//   const userid = req.user.userId;
//   const loginemail = req.user.loginemail;
//   try {
//     const {
//       name,
//       bio,
//       tags,
//       LinkedInUrl,
//       Githubusername,
//       Graduation,
//       backupemail,
//     } = req.body;

//     // Validate required fields
//     if (!userid) return res.status(400).json({ error: "User ID is required." });
//     if (!isValidObjectId(userid))
//       return res.status(400).json({ error: "Invalid user ID format." });

//     // Validate if the user exists
//     const user = await User.findOne({ _id: userid });
//     if (!user) return res.status(404).json({ error: "User not found." });

//     const username = user.username;

//     // Validate `tags` length
//     if (tags && tags.length > 3) {
//       return res.status(400).json({ error: "You can only have up to 3 tags." });
//     }

//     // Check if LinkedIn and GitHub usernames are unique
//     const existingProfile = await UserProfile.findOne({
//       $or: [{ LinkedInUrl }, { Githubusername }],
//     });

//     if (existingProfile) {
//       return res
//         .status(400)
//         .json({ error: "LinkedIn or GitHub username is already in use." });
//     }

//     // Check if backup email is already taken
//     if (backupemail) {
//       const existingBackupEmail = await UserProfile.findOne({ backupemail });
//       if (existingBackupEmail) {
//         return res
//           .status(400)
//           .json({ error: "Backup email is already in use." });
//       }
//     }

//     // Create user profile
//     const userProfileData = {
//       userid,
//       name,
//       username,
//       clgemail:loginemail,
//       bio,
//       tags,
//       LinkedInUrl,
//       Githubusername,
//       Graduation,
//       backupemail,
//     };

//     const userProfile = new UserProfile(userProfileData);
//     await userProfile.save();
//     user.isProfileCompleted=true;
//      await user.save();  

//     res
//       .status(201)
//       .json({ message: "User profile created successfully!", userProfile });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

exports.createUserProfile = async (req, res) => {
  const userid = req.user.userId;
  const loginemail = req.user.loginemail;
  try {
    const {
      name,
      bio,
      tags,
      LinkedInUrl,
      Githubusername,
      Graduation,
      backupemail,
    } = req.body;

    if (!userid) return res.status(400).json({ error: "User ID is required." });
    if (!isValidObjectId(userid))
      return res.status(400).json({ error: "Invalid user ID format." });

    const user = await User.findOne({ _id: userid });
    if (!user) return res.status(404).json({ error: "User not found." });

    const username = user.username;

    if (tags && tags.length > 3) {
      return res.status(400).json({ error: "You can only have up to 3 tags." });
    }

    // **🔹 Fix: Check only if LinkedInUrl or Githubusername are provided**
    if (LinkedInUrl) {
      const existingLinkedIn = await UserProfile.findOne({ LinkedInUrl });
      if (existingLinkedIn) {
        return res.status(400).json({ error: "LinkedIn URL already in use." });
      }
    }

    if (Githubusername) {
      const existingGithub = await UserProfile.findOne({ Githubusername });
      if (existingGithub) {
        return res.status(400).json({ error: "GitHub username already in use." });
      }
    }

    if (backupemail) {
      const existingBackupEmail = await UserProfile.findOne({ backupemail });
      if (existingBackupEmail) {
        return res.status(400).json({ error: "Backup email already in use." });
      }
    }

    const userProfileData = {
      userid,
      name,
      username,
      clgemail: loginemail,
      bio,
      tags,
      LinkedInUrl: LinkedInUrl || null, // **Ensure it's not undefined**
      Githubusername: Githubusername || null, // **Ensure it's not undefined**
      Graduation,
      backupemail,
    };

    const userProfile = new UserProfile(userProfileData);
    await userProfile.save();
    user.isProfileCompleted = true;
    await user.save();

    res.status(201).json({ message: "User profile created successfully!", userProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



 // Update a user profile by ID
exports.updateUserProfile = async (req, res) => {
  try {
    const userid = req.user.userId; // Extract user ID from the authenticated request
    const loginemail = req.user.loginemail; // Extract email from the authenticated request

    const {name, username, bio, LinkedInUrl, Githubusername, Graduation } =
      req.body;

    // Define the fields that can be updated
    const changeableFields = {
      name,
      username,
      bio,
      LinkedInUrl,
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
    const loginemail = req.user.loginemail;
    const user = await UserProfile.findByIdAndDelete(userid);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
