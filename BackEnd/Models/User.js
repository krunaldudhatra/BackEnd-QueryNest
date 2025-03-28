
const mongoose = require("mongoose");
const cron = require("node-cron");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    clgemail: { type: String, required: true, unique: true },
    backupemail: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    isProfileCompleted: { type: Boolean, default: false },
    avatarColor: { type: String, default: generateRandomColor }, // Fixed color for avatar
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

// Function to generate a random color
function generateRandomColor() {
  return Math.floor(Math.random() * 16777215).toString(16);
}

// Function to generate image URL with the avatar color
function generateImageUrl(name, color) {
  if (!name) return "";
  const words = name.split(" ");
  const initials =
    words.length >= 2
      ? words[0][0].toUpperCase() + words[1][0].toUpperCase()
      : words[0][0].toUpperCase();

  return `https://ui-avatars.com/api/?name=${initials}&background=${color}&color=fff`;
}

// Middleware for syncing updates with UserProfile schema
UserSchema.pre("save", async function (next) {
  if (!this.isModified("name") && !this.isModified("username") && !this.isModified("clgemail") && !this.isModified("backupemail") && !this.isModified("imageUrl")) {
    return next();
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

    await session.commitTransaction();
    session.endSession();
    next();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
});

// Cron Job: Updates avatar color and imageUrl every 2 hours
cron.schedule("0 */2 * * *", async () => {
  const users = await mongoose.model("User").find();

  for (const user of users) {
    const newColor = generateRandomColor();
    const newImageUrl = generateImageUrl(user.name, newColor);

    await mongoose.model("User").updateOne(
      { _id: user._id },
      { avatarColor: newColor, imageUrl: newImageUrl }
    );

    await mongoose.model("UserProfile").updateOne(
      { userid: user._id },
      { imageUrl: newImageUrl }
    );
  }

  console.log("✅ Avatar colors and images updated for all users.");
});

module.exports = mongoose.model("User", UserSchema);
