const Question = require("../Models/Question");
const TagDetails = require("../Models/TagDetails");
const User = require("../Models/User");

// Create a new question
exports.createQuestion = async (req, res) => {
  try {
    const { userId, question, tagName } = req.body;

    const tag = await TagDetails.findOne({ name: tagName });
    if (!tag) return res.status(404).json({ message: "Tag not found" });

    const newQuestion = new Question({
      userId,
      question,
      tag: tagName,
    });

    await newQuestion.save();
    res.status(201).json({ message: "Question created successfully", newQuestion });
  } catch (error) {
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
