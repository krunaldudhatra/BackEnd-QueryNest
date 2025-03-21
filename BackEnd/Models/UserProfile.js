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
    LinkedInUrl: { type: String, sparse: true },

    // GitHub-related fields
    githubUsername: { type: String, unique: true, sparse: true },
    githubPublicRepos: { type: Number, default: 0 },
    githubAvatarUrl: { type: String, default: "" },
    useGithubAvatar: { type: Boolean, default: false }, // User choice

    // Avatar and Image Handling
    avatarColor: { type: String, default: generateRandomColor },
    imageUrl: {
      type: String,
      default: function () {
        return this.useGithubAvatar && this.githubAvatarUrl
          ? this.githubAvatarUrl
          : generateImageUrl(this.name, this.avatarColor);
      },
    },

    // Other profile fields
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
    likedQuestion: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question", default: [] }],
    likedAnswer: [{ type: mongoose.Schema.Types.ObjectId, ref: "Answer", default: [] }],
  },
  { timestamps: true }
);

// Function to generate a random color
function generateRandomColor() {
  return Math.floor(Math.random() * 16777215).toString(16);
}

// Function to generate the avatar URL (only if user doesn't use GitHub avatar)
function generateImageUrl(name, color) {
  if (!name) return "";
  const words = name.split(" ");
  const initials =
    words.length >= 2
      ? words[0][0].toUpperCase() + words[1][0].toUpperCase()
      : words[0][0].toUpperCase();

  return `https://ui-avatars.com/api/?name=${initials}&background=${color}&color=fff`;
}

// Middleware to sync updates with the User schema
UserProfileSchema.pre("save", async function (next) {
  if (!this.isModified("name") && !this.isModified("username") && !this.isModified("clgemail") && !this.isModified("backupemail") && !this.isModified("imageUrl") && !this.isModified("avatarColor") && !this.isModified("useGithubAvatar")) {
    return next();
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Sync user data with User schema
    const updatedUserData = {
      name: this.name,
      username: this.username,
      clgemail: this.clgemail,
      backupemail: this.backupemail,
      avatarColor: this.avatarColor,
      imageUrl: this.useGithubAvatar && this.githubAvatarUrl
        ? this.githubAvatarUrl
        : generateImageUrl(this.name, this.avatarColor),
    };

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
