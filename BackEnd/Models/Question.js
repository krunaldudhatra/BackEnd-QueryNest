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
     { default:[]}
    ],
    tag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TagDetails",
      required: true,
    },
       likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      {default:[]}
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
