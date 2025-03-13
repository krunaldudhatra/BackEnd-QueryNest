const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
    },
    answerIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Answer",
      },
    ],
    tag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TagDetail",
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    noOfLikes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

 // Middleware to automatically update like count
QuestionSchema.pre("save", function (next) {
  this.noOfLikes = this.likes.length;
  next();
});

module.exports = mongoose.model("Question", QuestionSchema);
