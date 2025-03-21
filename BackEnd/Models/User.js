const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    clgemail: { type: String, required: true, unique: true },
    backupemail: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    isProfileCompleted: { type: Boolean, default: false },
    avatarColor: { type: String, default: generateRandomColor }, // Random color
    imageUrl: { type: String }, // No default function, update from UserProfile
  },
  { timestamps: true }
);

// Function to generate a random color
function generateRandomColor() {
  return Math.floor(Math.random() * 16777215).toString(16);
}

// Middleware to sync updates from UserProfile
UserSchema.pre("save", async function (next) {
  if (!this.isModified("name") && !this.isModified("username") && !this.isModified("clgemail") && !this.isModified("backupemail") && !this.isModified("avatarColor") && !this.isModified("imageUrl")) {
    return next();
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const updatedProfileData = {
      name: this.name,
      username: this.username,
      clgemail: this.clgemail,
      backupemail: this.backupemail,
      avatarColor: this.avatarColor,
      imageUrl: this.imageUrl,
    };

    const updatedProfile = await mongoose.model("UserProfile").findOneAndUpdate(
      { userid: this._id },
      updatedProfileData,
      { new: true, session }
    );

    if (!updatedProfile) {
      await session.abortTransaction();
      session.endSession();
      throw new Error("UserProfile update failed.");
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

module.exports = mongoose.model("User", UserSchema);
