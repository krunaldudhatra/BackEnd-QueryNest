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

exports.getQuestionById = async (req, res) => {
  try {
    const { questionId } = req.params;

    // Validate the question ID
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ error: "Invalid question ID format" });
    }

    // Fetch the question with populated fields
    const question = await Question.findById(questionId)
      .populate("userId", "username imageUrl")
      .populate("tag", "tagName")
      .populate({
        path: "answerIds",
        populate: {
          path: "userId",
          select: "username imageUrl",
        },
      })
      .lean(); // Convert to plain JavaScript object for better performance

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Return the structured response
    res.status(200).json({
      message: "Question fetched successfully",
      question: {
        id: question._id,
        content: question.question,
        user: question.userId,
        tag: question.tag,
        likeCount: question.likes?.length || 0, // Use array length directly
        answers: question.answerIds || [],
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching question by ID:", error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
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

exports.toggleLikeOnQuestion = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user?.userId;
    const { questionId, action } = req.body; // action: 'like' or 'unlike'

    if (!userId || !questionId || !action) {
      return res.status(400).json({ message: "User ID, Question ID, and action are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: "Invalid question ID" });
    }

    const question = await Question.findById(questionId).session(session);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const userProfile = await UserProfile.findOne({ userid: userId }).session(session);
    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found" });
    }

    if (action === "like") {
      if (question.likes.includes(userId)) {
        return res.status(400).json({ message: "Question already liked" });
      }

      question.likes.push(userId);
      userProfile.likedQuestion.push(questionId);

    } else if (action === "unlike") {
      if (!question.likes.includes(userId)) {
        return res.status(400).json({ message: "Question not liked yet" });
      }

      question.likes = question.likes.filter((id) => id.toString() !== userId);
      userProfile.likedQuestion = userProfile.likedQuestion.filter((id) => id.toString() !== questionId);

    } else {
      return res.status(400).json({ message: "Invalid action. Use 'like' or 'unlike'" });
    }

    await question.save({ session });
    await userProfile.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ 
      message: `Question ${action === "like" ? "liked" : "unliked"} successfully`,
      likes: question.likes.length,
      likeCount: question.likes.length, // Update like count directly
      userProfileLikedQuestions: userProfile.likedQuestion || [],
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: error.message });
  }
};

// Get all questions asked by the logged-in user (sender)
// Get questions sent by the logged-in user to users with matching tags

exports.getQuestionsBySenderAndTagMatch = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const { page = 1, limit = 10, sort = "-createdAt" } = req.query;

    // Find the sender's profile and their tags
    const senderProfile = await UserProfile.findOne({ userid: userId }).select("name tags");
    if (!senderProfile || !senderProfile.tags || senderProfile.tags.length === 0) {
      return res.status(404).json({ message: "Sender profile or tags not found" });
    }

    const senderTagNames = senderProfile.tags;
    console.log("Sender Tags:", senderTagNames);

    // Find tag IDs for the sender's tags
    const tagDetails = await TagDetails.find({ tagName: { $in: senderTagNames } });
    if (!tagDetails || tagDetails.length === 0) {
      return res.status(404).json({ message: "Matching tags not found in TagDetail collection" });
    }

    const senderTagIds = tagDetails.map(tag => tag._id);
    console.log("Sender Tag IDs:", senderTagIds);

    // Find questions where the tag matches any of the sender's tag IDs
    const questions = await Question.find({ 
      tag: { $in: senderTagIds }
    })
      .populate("userId", "username name imageUrl")
      .populate("tag", "tagName")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalQuestions = await Question.countDocuments({ 
      tag: { $in: senderTagIds }
    });
    console.log("Total matched questions:", totalQuestions);

    res.status(200).json({
      message: "Questions fetched successfully with matching tags",
      senderName: senderProfile.name,
      questions,
      totalQuestions,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalQuestions / limit),
    });
  } catch (error) {
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
