const mongoose = require("mongoose");

const UserProfileSchema = new mongoose.Schema(
  {
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    clgemail: { type: String, unique: true },
    backupemail: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    bio: { type: String, required: true },
    tags: {
      type: [{ type: String }],
      validate: {
        validator: function (tags) {
          return tags.length <= 3;
        },
        message: "You can only have up to 3 tags.",
      },
    },
    LinkedInUrl: { type: String, unique: true, sparse: true },
    Githubusername: { type: String, required: true, unique: true },
    noOfQuestions: { type: Number, default: 0 },
    Graduation: { type: String },
    noOfAnswers: { type: Number, default: 0 },
    avgRating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be negative."],
      max: [5, "Rating cannot be greater than 5."],
    },
    totalPoints: {
      type: Number,
      default: 0,
      min: [0, "Total points cannot be negative."],
    },
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question", default: [] }],
    answerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Answer", default: [] }],
    achievements: [{ type: String, default: [] }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
    noOfFollowers: { type: Number, default: 0 },
    noOfFollowing: { type: Number, default: 0 },
    imageUrl: {
      type: String,
      default: "https://ui-avatars.com/api/?name=User&background=random&color=fff",
    },
    likedQuestion: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question", default: [] }],
    likedAnswer: [{ type: mongoose.Schema.Types.ObjectId, ref: "Answer", default: [] }],
  },
  { timestamps: true }
);

// Middleware to sync updates with the User schema
UserProfileSchema.pre("save", async function (next) {
  if (!this.isModified("name") && !this.isModified("username") && !this.isModified("clgemail") && !this.isModified("backupemail") && !this.isModified("imageUrl")) {
    return next();
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const updatedUserData = {
      name: this.name,
      username: this.username,
      clgemail: this.clgemail,
      backupemail: this.backupemail,
      imageUrl: this.imageUrl,
    };

    // Update the corresponding User document
    const updatedUser = await mongoose.model("User").findByIdAndUpdate(
      this.userid,
      updatedUserData,
      { new: true, session }
    );

    if (!updatedUser) {
      await session.abortTransaction();
      session.endSession();
      throw new Error("User update failed.");
    }

    await session.commitTransaction();
    session.endSession();
    next();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
});

module.exports = mongoose.model("UserProfile", UserProfileSchema);
