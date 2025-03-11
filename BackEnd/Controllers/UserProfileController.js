const mongoose = require("mongoose");
const isValidObjectId = mongoose.Types.ObjectId.isValid;

const UserProfile = require('../Models/UserProfile');
const User = require("../Models/User");

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
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create a new user Profile
exports.createUserProfile = async (req, res) => {
    try {
        const {
            userid,
            bio,
            tags,
            achievements,
            questionIds,
            answerIds,
            followers,
            following,
            avgRating,
            totalPoints,
            LinkedInusername,
            Githubusername,
            Graduation,
            backupemail,
            imageUrl,
            noOfFollowers,
            noOfFollowing 
        } = req.body;
        // Validate required fields
        if (!userid) {
            return res.status(400).json({ error: "User ID is required." });
        }

        if (!isValidObjectId(userid)) {
            return res.status(400).json({ error: "Invalid user ID format." });
        }

        // Check for invalid ObjectIds
        const invalidQuestionIds = questionIds?.filter((id) => !isValidObjectId(id));
        const invalidAnswerIds = answerIds?.filter((id) => !isValidObjectId(id));
        const invalidFollowers = followers?.filter((id) => !isValidObjectId(id));
        const invalidFollowing = following?.filter((id) => !isValidObjectId(id));

        if (invalidQuestionIds.length || invalidAnswerIds.length || invalidFollowers.length || invalidFollowing.length) {
            return res.status(400).json({
                error: "Invalid ObjectId(s) found",
                invalidQuestionIds,
                invalidAnswerIds,
                invalidFollowers,
                invalidFollowing,
            });
        }

        // Fetch user name for image URL
        const user = await User.findById(userid);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // Prepare the profile data
        const userProfileData = {
            userid,
            bio,
            tags,
            avgRating,
            totalPoints,
            achievements,
            questionIds,
            answerIds,
            followers,
            following,
            LinkedInusername,
            Githubusername,
            Graduation,
            backupemail,
            imageUrl,
            noOfFollowers,
            noOfFollowing 
        };

        // Save the user profile
        const userProfile = new UserProfile(userProfileData);
        await userProfile.save();

        res.status(201).json({ message: "User profile created successfully!", userProfile });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Update a user Profile by ID
exports.updateUserProfile = async (req, res) => {
    try {
        // Ensure required fields are present in the body if updating essential data
        const { email } = req.body;
        if (email && !email.trim()) {
            return res.status(400).json({ error: 'Email cannot be empty' });
        }

        // Only allow the fields defined in the schema
        const validFields = ['name', 'username', 'email', 'password', 'githubLink', 'linkedinLink'];
        const filteredBody = Object.keys(req.body)
            .filter(key => validFields.includes(key))
            .reduce((obj, key) => {
                obj[key] = req.body[key];
                return obj;
            }, {});

        const user = await UserProfile.findByIdAndUpdate(req.params.id, filteredBody, { new: true, runValidators: true });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete a user Profile by ID
exports.deleteUserProfile = async (req, res) => {
    try {
        const user = await UserProfile.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
