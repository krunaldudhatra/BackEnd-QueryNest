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
    avatarColor: { type: String }, // Fixed color for avatar
    imageUrl: {
      type: String,
      default: function () {
        return generateImageUrl(this.name, this.avatarColor);
      },
    },
    createdAt: { type: Date, default: Date.now },
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

// Middleware for atomic updates with rollback
UserSchema.pre("save", async function (next) {
  if (!this.isModified("name") && !this.isModified("username") && !this.isModified("clgemail") && !this.isModified("backupemail")) {
    return next(); // Skip if nothing is modified
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userProfile = await mongoose.model("UserProfile").findOne({ userid: this._id }).session(session);
    if (!userProfile) {
      await session.abortTransaction();
      session.endSession();
      throw new Error("UserProfile not found for this user.");
    }

    const isNameChanged = this.isModified("name");

    if (this.isNew) {
      // Generate a fixed color only when the user is created
      this.avatarColor = Math.floor(Math.random() * 16777215).toString(16);
      this.imageUrl = generateImageUrl(this.name, this.avatarColor);
    } else if (isNameChanged) {
      // Update image only if the name changes
      this.imageUrl = generateImageUrl(this.name, this.avatarColor);
    }

    // Prepare updated UserProfile data
    const updatedProfileData = {
      name: this.name,
      username: this.username,
      clgemail: this.clgemail,
      backupemail: this.backupemail,
      imageUrl: this.imageUrl,
    };

    // Update UserProfile
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

    // If UserProfile updated successfully, commit transaction
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
