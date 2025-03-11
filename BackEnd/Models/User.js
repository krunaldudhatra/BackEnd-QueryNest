const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    clgemail: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    otp: { type: String },
    otpExpires: { type: Date },
    verified: { type: Boolean, default: false }, // Track verification status

    resetPasscode: { type: String },
    resetPasscodeExpires: { type: Date },

    // Delete only if OTP expires and the user is still not verified
    otpDeletionTime: { 
      type: Date,
      index: {
        expireAfterSeconds: 120, // Delete 2 mins after OTP expires
        partialFilterExpression: { 
          verified: false, 
          otpExpires: { $exists: true, $lte: new Date() } // Only consider OTP expiration
        } 
      }
    },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
