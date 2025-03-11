const mongoose = require("mongoose");

const TempSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    clgemail: { type: String, required: true, unique: true },
    backupemail: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },

    otp: { type: String },
    otpExpires: { type: Date },
    verified: { type: Boolean, default: false }, // Track verification status

    resetPasscode: { type: String },
    resetPasscodeExpires: { type: Date },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Temp", TempSchema);
