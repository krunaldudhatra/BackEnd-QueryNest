const mongoose = require("mongoose");

const UserProfileSchema = new mongoose.Schema(
  {
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    bio: { type: String },
    tags: [{ type: String }],
    LinkedInusername: { type: String, required: true, unique: true },
    Githubusername: { type: String, required: true, unique: true },
    noOfQuestions: { type: Number, default: 0 },
    Graduation: { type: String },
    noOfAnswers: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    backupemail: { type: String },
    totalPoints: { type: Number, default: 0 },
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    answerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Answer" }],
    achievements: [{ type: String }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Image URL
    imageUrl: { type: String },

    // Permanent fields for counts
    noOfFollowers: { type: Number, default: 0 },
    noOfFollowing: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Function to generate image initials
function generateImageUrl(name) {
  if (!name) return "";

  const words = name.split(" ");
  const initials =
    words.length >= 2
      ? words[0][0].toUpperCase() + words[1][0].toUpperCase()
      : words[0][0].toUpperCase();

  // Generate a random hex color
  const randomColor = Math.floor(Math.random() * 16777215).toString(16);

  return `https://ui-avatars.com/api/?name=${initials}&background=${randomColor}&color=fff`;
}

// Middleware to automatically update counts and generate image URL
UserProfileSchema.pre("save", async function (next) {
  this.noOfFollowers = this.followers.length;
  this.noOfFollowing = this.following.length;

  // Populate the user to get the name for the image
  if (this.isNew || this.isModified("userid")) {
    const user = await mongoose.model("User").findById(this.userid);
    if (user && user.name) {
      this.imageUrl = generateImageUrl(user.name);
    }
  }

  next();
});

module.exports = mongoose.model("UserProfile", UserProfileSchema);
