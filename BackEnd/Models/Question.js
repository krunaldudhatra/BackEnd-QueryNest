const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      default:
        "https://ui-avatars.com/api/?name=User&background=random&color=fff",
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserProfile",
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
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Virtual for number of likes
QuestionSchema.virtual("noOfLikes").get(function () {
  return this.likes.length;
});

// Middleware to populate username, imageUrl, and profileId
QuestionSchema.pre("save", async function (next) {
  try {
    const user = await mongoose.model("User").findById(this.userId);
    const userProfile = await mongoose
      .model("UserProfile")
      .findOne({ userid: this.userId });

    if (user) {
      this.username = user.username;
    }
    if (userProfile) {
      this.imageUrl = userProfile.imageUrl || this.imageUrl;
      this.profileId = userProfile._id;
    }

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Question", QuestionSchema);
