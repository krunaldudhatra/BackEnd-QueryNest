const mongoose = require("mongoose");

const TagSchema = new mongoose.Schema(
  {
    tagId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    tagName: {
      type: String,
      required: true,
      unique: true,
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
  },
  { timestamps: true }
);

// Virtual to calculate the number of users
TagSchema.virtual("noOfUsers").get(function () {
  return this.users.length;
});

module.exports = mongoose.model("Tag", TagSchema);
