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
      throw new Error("Tag not found");
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


// Get all questions with user and tag details
exports.getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find()
      .populate("userId", "username imageUrl")
      .populate("tag", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get questions by tag name
exports.getQuestionsByTag = async (req, res) => {
  try {
    const { tagName } = req.params;

    const tag = await TagDetails.findOne({ name: tagName });
    if (!tag) return res.status(404).json({ message: "Tag not found" });

    const questions = await Question.find({ tag: tag._id })
      .populate("userId", "username imageUrl")
      .populate("tag", "name");

    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Like a question
exports.likeQuestion = async (req, res) => {
  try {
    const { questionId, userId } = req.body;

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: "Question not found" });

    const alreadyLiked = question.likes.includes(userId);
    if (alreadyLiked) {
      question.likes = question.likes.filter((id) => id.toString() !== userId);
    } else {
      question.likes.push(userId);
    }

    await question.save();
    res.status(200).json({ message: "Like updated", likes: question.likes.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a question
exports.deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    await Question.findByIdAndDelete(questionId);
    res.status(200).json({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;

// Let me know if you want me to add more routes or refine anything! 🚀
