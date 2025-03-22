const mongoose = require("mongoose");
const axios = require("axios");

// Function to generate a random color
function generateRandomColor() {
  return Math.floor(Math.random() * 16777215).toString(16);
}

// Function to generate the avatar URL
function generateImageUrl(name) {
  if (!name) return "";
  const words = name.split(" ");
  const initials =
    words.length >= 2
      ? words[0][0].toUpperCase() + words[1][0].toUpperCase()
      : words[0][0].toUpperCase();
  
  const randomColor = generateRandomColor();
  return `https://ui-avatars.com/api/?name=${initials}&background=${randomColor}&color=fff`;
}

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
    useGithubAvatar: { type: Boolean, default: false },

    // Avatar and Image Handling
    imageUrl: {
      type: String,
      default: function () {
        return this.useGithubAvatar && this.githubAvatarUrl
          ? this.githubAvatarUrl
          : generateImageUrl(this.name);
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
UserProfileSchema.index({ name: "text", username: "text", bio: "text" });


// Middleware to sync updates with the User schema
UserProfileSchema.pre("save", async function (next) {
  if (
    !this.isModified("name") &&
    !this.isModified("username") &&
    !this.isModified("clgemail") &&
    !this.isModified("backupemail") &&
    !this.isModified("imageUrl") &&
    !this.isModified("useGithubAvatar") &&
    !this.isModified("githubUsername")
  ) {
    return next();
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // If `githubUsername` changed, fetch new avatar and repo count
    if (this.isModified("githubUsername") && this.githubUsername) {
      try {
        const githubResponse = await axios.get(
          `https://api.github.com/users/${this.githubUsername}`
        );
        this.githubAvatarUrl = githubResponse.data.avatar_url;
        this.githubPublicRepos = githubResponse.data.public_repos;
      } catch (githubError) {
        await session.abortTransaction();
        session.endSession();
        return next(
          new Error(
            `Invalid GitHub username or API request failed: ${
              githubError.response?.data?.message || githubError.message
            }`
          )
        );
      }
    }

    // Ensure `imageUrl` updates correctly based on `useGithubAvatar`
    if (this.isModified("useGithubAvatar") || this.isModified("githubAvatarUrl") || this.isModified("githubUsername")) {
      this.imageUrl =
        this.useGithubAvatar && this.githubAvatarUrl
          ? this.githubAvatarUrl
          : generateImageUrl(this.name);
    }

    // Sync user data with User schema
    const updatedUserData = {
      name: this.name,
      username: this.username,
      clgemail: this.clgemail,
      backupemail: this.backupemail,
      imageUrl: this.imageUrl, // Updated imageUrl
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
