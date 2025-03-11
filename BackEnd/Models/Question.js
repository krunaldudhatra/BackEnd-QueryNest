const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserDetails",
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
    },
    answerIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Answer",
    }],
    timestamp: {
      type: Date,
      default: Date.now,
    },
    tag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TagDetails",
      required: true,
    },
    questionPoint: {
      type: Number,
      default: 0,
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserDetails",
    }],
  },
  { timestamps: true }
);

// Virtual for number of likes
QuestionSchema.virtual("noOfLikes").get(function () {
  return this.likes.length;
});

module.exports = mongoose.model("Question", QuestionSchema);
