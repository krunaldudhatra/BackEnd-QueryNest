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

    resetPasscode: { type: String },
    resetPasscodeExpires: { type: Date },

    imageUrl: {
      type: String,
      default: function () {
        return generateImageUrl(this.name);
      },
    },

    createdAt: { type: Date, default: Date.now },
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

  const randomColor = Math.floor(Math.random() * 16777215).toString(16);
  return `https://ui-avatars.com/api/?name=${initials}&background=${randomColor}&color=fff`;
}

// Middleware to update imageUrl when name changes
UserSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.imageUrl = generateImageUrl(this.name);
  }
  next();
});

module.exports = mongoose.model("User", UserSchema);
