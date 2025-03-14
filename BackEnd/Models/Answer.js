const mongoose = require("mongoose");
const Question = require("./Question");

const AnswerSchema = new mongoose.Schema(
  {
    answerId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    answer: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    ansDuration: { type: Number }, // Duration in seconds
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: [],
    }],
    noOfLikes: {
      type: Number,
      default: 0,
    },
    rating: { type: Number, default: 0 },
    point: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Virtual for number of likes
AnswerSchema.pre("save", function (next) {
  this.noOfLikes = this.likes.length;
  next();
});

// Middleware to calculate answer duration
AnswerSchema.pre("save", async function (next) {
  try {
    const question = await Question.findById(this.questionId);
    if (question) {
      this.ansDuration = Math.floor((this.timestamp - question.timestamp) / 1000); // Duration between question and answer timestamps
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Answer", AnswerSchema);
