const mongoose = require("mongoose");

const UserProfileSchema = new mongoose.Schema(
  {
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    clgemail: { type: String, unique: true, required: true },
    backupemail: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    bio: { type: String, required: true },
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
    noOfFollowers: { type: Number, default: 0 },
    noOfFollowing: { type: Number, default: 0 },
    avatarColor: { type: String }, // Store fixed avatar color
    imageUrl: {
      type: String,
      default: function () {
        return generateImageUrl(this.name, this.avatarColor);
      },
    },
  },
  { timestamps: true }
);

// Function to generate image URL with fixed color
function generateImageUrl(name, color) {
  if (!name) return "";
  const words = name.split(" ");
  const initials =
    words.length >= 2
      ? words[0][0].toUpperCase() + words[1][0].toUpperCase()
      : words[0][0].toUpperCase();

  return `https://ui-avatars.com/api/?name=${initials}&background=${color}&color=fff`;
}

// Middleware to sync UserProfile with User
UserProfileSchema.pre("save", async function (next) {
  const isNewProfile = this.isNew;
  const isNameChanged = this.isModified("name");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await mongoose.model("User").findById(this.userid).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      throw new Error("User not found for this profile.");
    }

    if (isNewProfile) {
      // Generate a fixed color only when the profile is created
      this.avatarColor = Math.floor(Math.random() * 16777215).toString(16);
      this.imageUrl = generateImageUrl(this.name, this.avatarColor);
    } else if (isNameChanged) {
      // Only update image URL if the name is changed
      this.imageUrl = generateImageUrl(this.name, this.avatarColor);
    }

    // Prepare updated User data
    const updatedUserData = {
      name: this.name,
      username: this.username,
      clgemail: this.clgemail,
      backupemail: this.backupemail,
      imageUrl: this.imageUrl,
    };

    // Update User
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
