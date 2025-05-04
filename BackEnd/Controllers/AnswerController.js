const Answer = require("../Models/Answer.js");
const UserProfile = require("../Models/UserProfile.js");
const User = require("../Models/User");
const Question = require("../Models/Question.js");
const TagDetail = require("../Models/TagDetails.js");
const mongoose = require("mongoose");
require("dotenv").config();

exports.createAnswer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { questionId, content } = req.body;
    const userId = req.user.userId;

    if (!userId || !questionId || !content) {
      return res
        .status(400)
        .json({
          error:
            "All required fields (userId, questionId, content) must be provided.",
        });
    }

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ error: "Invalid question ID format." });
    }

    const question = await Question.findById(questionId).session(session);
    if (!question) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "Question not found." });
    }

    const tag = await TagDetail.findById(question.tag).session(session);
    if (!tag) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "Tag not found for the question." });
    }

    const pointsEarned = tag.tagPoint;

    const answer = new Answer({
      userId,
      questionId,
      answer: content,
      point: pointsEarned,
    });

    const savedAnswer = await answer.save({ session });

    question.answerIds.push(savedAnswer._id);
    await question.save({ session });

    const userProfile = await UserProfile.findOne({ userid: userId }).session(
      session
    );
    if (!userProfile) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "User profile not found." });
    }

    userProfile.answerIds.push(savedAnswer._id);
    question.markModified("answerIds");
    userProfile.noOfAnswers = userProfile.answerIds.length;
    userProfile.totalPoints += pointsEarned;
    await userProfile.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Answer created successfully",
      savedAnswer,
      pointsEarned,
      tagName: tag.tagName,
      answerDuration: savedAnswer.ansDuration,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: err.message });
  }
};

// Fetch all answers with pagination and sorting
exports.getAllAnswers = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = "-createdAt" } = req.query;

    const answers = await Answer.find()
      .populate("userId", "username")
      .populate("questionId")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalAnswers = await Answer.countDocuments();

    res.json({
      message: "Answers fetched successfully",
      answers,
      totalAnswers,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalAnswers / limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Fetch a single answer by AnswerID
exports.getAnswerById = async (req, res) => {
  try {
    const { answerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(answerId)) {
      return res.status(400).json({ error: "Invalid answer ID format" });
    }

    const answer = await Answer.findById(answerId)
      .populate("userId", "username name imageUrl")
      .populate("questionId", "question")
      .populate({
        path: "likes",
        select: "username name imageUrl",
      });

    if (!answer) {
      return res.status(404).json({ error: "Answer not found" });
    }

    res.status(200).json({
      message: "Answer fetched successfully",
      answer,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// get all answers by username
exports.getAllAnswersByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10, sort = "-createdAt" } = req.query;

    // Find user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    // Find answers by userId
    const answers = await Answer.find({ userId })
      .populate("userId", "username name imageUrl") // Fetch user details
      .populate("questionId", "title") // Fetch question title
      .sort(sort)
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
      .limit(parseInt(limit, 10));

    const totalAnswers = await Answer.countDocuments({ userId });

    res.status(200).json({
      message: "Answers fetched successfully",
      answers,
      totalAnswers,
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(totalAnswers / parseInt(limit, 10)),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// like and unlike for answer
exports.toggleLikeOnAnswer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user?.userId;
    const { answerId, action } = req.body; // action: 'like' or 'unlike'

    if (!userId || !answerId || !action) {
      return res.status(400).json({ message: "User ID, Answer ID, and action are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(answerId)) {
      return res.status(400).json({ message: "Invalid answer ID" });
    }

    const answer = await Answer.findById(answerId).session(session);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    const userProfile = await UserProfile.findOne({ userid: userId }).session(session);
    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found" });
    }

    if (action === "like") {
      if (answer.likes.includes(userId)) {
        return res.status(400).json({ message: "Answer already liked" });
      }

      answer.likes.push(userId);
      userProfile.likedAnswer = userProfile.likedAnswer || [];
      userProfile.likedAnswer.push(answerId);

    } else if (action === "unlike") {
      if (!answer.likes.includes(userId)) {
        return res.status(400).json({ message: "Answer not liked yet" });
      }

      answer.likes = answer.likes.filter((id) => id.toString() !== userId);
      userProfile.likedAnswer = userProfile.likedAnswer.filter((id) => id.toString() !== answerId);

    } else {
      return res.status(400).json({ message: "Invalid action. Use 'like' or 'unlike'" });
    }

    // Update the number of likes dynamically
    answer.noOfLikes = answer.likes.length;

    await answer.save({ session });
    await userProfile.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: `Answer ${action === "like" ? "liked" : "unliked"} successfully`,
      likes: answer.likes.length,
      likeCount: answer.noOfLikes, // Updated like count
      userProfileLikedAnswers: userProfile.likedAnswer || [],
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: error.message });
  }
};

// Get answers by user ID
exports.getAnswersByUserId = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format." });
    }

    const answers = await Answer.find({ userId })
      .populate("questionId", "userId")
      .select("_id userId questionId content");

    const formattedAnswers = answers.map((answer) => ({
      answerId: answer._id,
      questionId: answer.questionId?._id,
      questionedUserId: answer.questionId?.userId,
      content: answer.content,
    }));

    res.json(formattedAnswers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update an answer
exports.updateAnswer = async (req, res) => {
  try {
    const updatedAnswer = await Answer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedAnswer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete an answer
exports.deleteAnswer = async (req, res) => {
  try {
    await Answer.findByIdAndDelete(req.params.id);
    res.json({ message: "Answer deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

async function updateUserAvgRating(userId) {
  const answers = await Answer.find({ userId });

  let totalRatings = 0;
  let ratingCount = 0;

  answers.forEach(answer => {
    if (answer.ratings && answer.ratings.length > 0) {
      totalRatings += answer.ratings.reduce((sum, r) => sum + r.rating, 0); // changed to .rating
      ratingCount += answer.ratings.length;
    }
  });

  const avgRating = ratingCount > 0 ? totalRatings / ratingCount : 0;

  await UserProfile.findOneAndUpdate(
    { userid: userId },
    { avgRating },
    { new: true }
  );
}


// Update user average rating via API
exports.addOrUpdateRating = async (req, res) => {
  try {
    const userId = req.user.userId; // Authenticated user
    const { answerId, rating } = req.body;

    if (!mongoose.Types.ObjectId.isValid(answerId)) {
      return res.status(400).json({ error: "Invalid answer ID." });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }

    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).json({ error: "Answer not found." });
    }

    const existingRatingIndex = answer.ratings.findIndex(r => r.userId.toString() === userId);

    if (existingRatingIndex >= 0) {
      // Update existing rating
      answer.ratings[existingRatingIndex].rating = rating;
    } else {
      // Add new rating
      answer.ratings.push({ userId, rating });
    }

    await answer.save();

    // ✅ Update avg rating for the answer's author
    await updateUserAvgRating(answer.userId);

    res.json({ message: "Rating submitted successfully", answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = exports;


