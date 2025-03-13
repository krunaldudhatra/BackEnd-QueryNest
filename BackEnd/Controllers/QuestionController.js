const Question = require("../Models/Question");
const TagDetails = require("../Models/TagDetails");
const mongoose = require("mongoose");
const User = require("../Models/User");
const UserProfile=require("../Models/UserProfile");
require("dotenv").config();
const QUESTION_ASK_POINT=process.env.QUESTION_ASK_POINT

// Create a new question
exports.createQuestion = async (req, res) => {
  const session = await mongoose.startSession(); // Start a session for the transaction
  session.startTransaction();

  try {
    const { question, tagName } = req.body;
    const userId = req.user.userId;
    const email = req.user.email;

    // Find the tag by name
    const tag = await TagDetails.findOne({ tagName }).session(session);
    if (!tag) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "Tag not found" });
    }
    

    console.log(tagName);
    console.log(tag);

    // Create the question
    const newQuestion = new Question({
      userId,
      question,
      tag: tag.id,
    });

    await newQuestion.save({ session });

    // Find the user's profile
    const userProfile = await UserProfile.findOne({ userid: userId }).session(session);

    if (!userProfile) {
      // If no profile found, delete the question and throw an error
      await Question.findByIdAndDelete(newQuestion._id).session(session);
      throw new Error("User profile not found");
    }

    // Update the user profile
    userProfile.questionIds.push(newQuestion._id);
    userProfile.noOfQuestions = userProfile.questionIds.length;
    userProfile.totalPoints+=parseInt(QUESTION_ASK_POINT)
    await userProfile.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: "Question created successfully", newQuestion });
  } catch (error) {
    // Rollback the transaction and clean up if anything fails
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({ error: error.message });
  }
};


// Get all questions
exports.getAllQuestions = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = "-createdAt", tag } = req.query;

    const query = tag ? { tag } : {};

    const questions = await Question.find(query)
      .populate("userId", "username") // Populate user details (optional)
      .populate("tag", "name")        // Populate tag details (optional)
      .sort(sort)                     // Sort by createdAt (default)
      .skip((page - 1) * limit)       // Pagination logic
      .limit(parseInt(limit));        // Limit results per page

    const totalQuestions = await Question.countDocuments(query);

    res.status(200).json({
      message: "Questions fetched successfully",
      questions,
      totalQuestions,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalQuestions / limit),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all questions by user ID
exports.getAllQuestionsByUsername = async (req, res) => {
  try {
    const loginuserid=req.user.userId;

    const {username}=req.params;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const userId = user._id;
    
    // const { userId } = req.params;
    const { page = 1, limit = 10, sort = "-createdAt" } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const questions = await Question.find({ userId })
      .populate("userId", "username")
      .populate("tag", "name")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalQuestions = await Question.countDocuments({ userId });

    res.status(200).json({
      message: "Questions fetched successfully",
      questions,
      totalQuestions,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalQuestions / limit),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// Get questions by tag name
exports.getQuestionsByTag = async (req, res) => {
  try {
    const { tagName } = req.params;

    const tag = await TagDetails.findOne({ tagName: tagName });
    if (!tag) return res.status(404).json({ message: "Tag not found" });

    const questions = await Question.find({ tag: tag._id })
      .populate("userId", "username imageUrl")
      .populate("tag", "name");

    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Like a question// Like a question (with transactions)
exports.likeTheQuestionByUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user?.userId;
    const { questionId } = req.body;

    if (!userId || !questionId) {
      return res.status(400).json({ message: "User ID or Question ID missing" });
    }

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: "Invalid question ID" });
    }

    const question = await Question.findById(questionId).session(session);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    if (Array.isArray(question.likes) && question.likes.includes(userId)) {
      return res.status(400).json({ message: "Question already liked" });
    }

    // Update question and user profile
    question.likes.push(userId);
    await question.save({ session });

    const userProfile = await UserProfile.findOne({ userid: userId }).session(session);
    if (userProfile) {
      if (!Array.isArray(userProfile.likedQuestion)) {
        userProfile.likedQuestion = [];
      }

      if (!userProfile.likedQuestion.includes(questionId)) {
        userProfile.likedQuestion.push(questionId);
      }
      await userProfile.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ 
      message: "Question liked successfully", 
      likes: question.likes.length,
      likeCount: question.noOfLikes,
      userProfileLikedQuestions: userProfile?.likedQuestion || [],
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: error.message });
  }
};


// Remove like from a question (with transactions)
exports.removeLikeFromQuestion = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.userId;
    const { questionId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: "Invalid question ID" });
    }

    const question = await Question.findById(questionId).session(session);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const alreadyLiked = question.likes.includes(userId);
    if (!alreadyLiked) {
      return res.status(400).json({ message: "Question not liked yet" });
    }

    // Remove like from question and update profile
    question.likes = question.likes.filter((id) => id.toString() !== userId);
    await question.save({ session });

    const userProfile = await UserProfile.findOne({ userid: userId }).session(session);
    if (userProfile) {
      userProfile.likedQuestion = userProfile.likedQuestion.filter(
        (id) => id.toString() !== questionId
      );
      await userProfile.save({ session });
    }

    // Commit the transaction if everything is successful
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ 
      message: "Like removed successfully", 
      likes: question.likes.length,
      likeCount: question.noOfLikes,
      userProfileLikedQuestions: userProfile?.likedQuestion || [],
    });

  } catch (error) {
    // Abort transaction and roll back changes if error occurs
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({ error: error.message });
  }
};



// // Delete a question
// exports.deleteQuestion = async (req, res) => {
//   try {
//     const { questionId } = req.params;

//     await Question.findByIdAndDelete(questionId);
//     res.status(200).json({ message: "Question deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

module.exports = exports;

// Let me know if you want me to add more routes or refine anything! 🚀
