const mongoose = require("mongoose");
const User = require("../Models/User");
const UserProfile = require("../Models/UserProfile");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_USER = process.env.EMAIL_USER;
// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

// Send OTP Email
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: EMAIL_USER,
    to: email,
    subject: "Verify Your QueryNest Account - OTP",
    html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); max-width: 500px; margin: auto; background-color: #fbf5ee;">
            <h2 style="color: #2c3e50; text-align: center;">QueryNest Account Verification</h2>
            <p style="font-size: 16px; text-align: center; margin: 20px 30px;">Your One-Time Password (OTP) for registration is:</p>
            <div style="font-size: 24px; font-weight: bold; text-align: center; padding: 15px; background-color: #dec498; color: #fbf5ee; border-radius: 5px;">
                ${otp}
            </div>
            <p style="font-size: 14px; text-align: center; color: #e74c3c; margin: 20px;">This OTP will expire in 5 minutes.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <div style="text-align: center; padding: 10px 20px;">
                <p style="font-size: 12px; color: #7f8c8d;">If you didn’t request this, please ignore this email or contact support.</p>
                <p style="font-size: 12px; color: #7f8c8d;">&copy; ${new Date().getFullYear()} QueryNest. All rights reserved.</p>
            </div>
        </div>`,
  };

  await transporter.sendMail(mailOptions);
};

// Register & Send OTP
exports.registerUser = async (req, res) => {
  try {
    const { name, username, clgemail, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ clgemail });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists!" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP and set expiration
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes
    const otpDeletionTime = new Date(otpExpires.getTime() + 2 * 60 * 1000); // Delete 2 mins after OTP expiry

    // Create new user
    const newUser = new User({
      name,
      username,
      clgemail,
      password: hashedPassword,
      otp,
      otpExpires,
      otpDeletionTime,
    });

    await newUser.save();

    // Send OTP email
    await sendOTPEmail(clgemail, otp);

    res.status(201).json({ message: "OTP sent! Verify your email." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { clgemail, otp } = req.body;

    const user = await User.findOne({ clgemail });

    if (!user) return res.status(404).json({ error: "User not found!" });

    // Check OTP and expiration
    if (user.otp != otp || user.otpExpires < new Date()) {
      return res.status(400).json({ error: "Invalid or expired OTP!" });
    }

    // OTP verified — update fields
    user.otp = null;
    user.otpExpires = null;
    user.otpDeletionTime = null; // Clear deletion time
    user.verified = true; // Mark user as verified
    await user.save();

    // Send confirmation email
    await transporter.sendMail({
      from: EMAIL_USER,
      to: clgemail,
      subject: "Registration Successful 🎉",
      html: `<h1>Congratulations, ${user.name}!</h1>
                   <p>Your registration is complete. Welcome to our platform! 🎉</p>`,
    });

    res.status(200).json({ message: "Registration successful!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const { clgemail } = req.body;

    if (!clgemail) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await User.findOne({ clgemail });

    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }

    // Generate new OTP and extend expiration
    const newOTP = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration
    const otpDeletionTime = new Date(otpExpires.getTime() + 2 * 60 * 1000); // Delete 2 mins after new expiry

    user.otp = newOTP;
    user.otpExpires = otpExpires;
    user.otpDeletionTime = otpDeletionTime;

    await user.save();

    // Resend OTP email
    await sendOTPEmail(clgemail, newOTP);

    res.status(200).json({ message: "New OTP sent to your email." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login controller
exports.loginUser = async (req, res) => {
  try {
    const { clgemail, password } = req.body;

    // Find user by email
    const user = await User.findOne({ clgemail });
    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials!" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, clgemail: user.clgemail },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      message: "Login successful!",
      userId: user._id,
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Request Password Reset (Send Passcode)
exports.requestPasswordReset = async (req, res) => {
  try {
    const { clgemail } = req.body;

    const user = await User.findOne({ clgemail });
    if (!user) return res.status(404).json({ error: "User not found!" });

    // Generate passcode and set expiration
    const resetPasscode = generateOTP(); // 6-digit passcode
    const passcodeExpires = new Date(Date.now() + 20 * 60 * 1000); // Expires in 20 minutes

    // Save passcode & expiration in the database
    user.resetPasscode = resetPasscode;
    user.resetPasscodeExpires = passcodeExpires;
    await user.save();

    // Send passcode email
    await transporter.sendMail({
      from: EMAIL_USER,
      to: clgemail,
      subject: "Reset Your Password - QueryNest",
      html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 500px; margin: auto; background-color: #fbf5ee;">
                <h2 style="color: #2c3e50; text-align: center;">Password Reset Request</h2>
                <p style="font-size: 16px; text-align: center;">Use the passcode below to reset your password:</p>
                <div style="font-size: 24px; font-weight: bold; text-align: center; padding: 15px; background-color: #dec498; color: #fbf5ee; border-radius: 5px;">
                    ${resetPasscode}
                </div>
                <p style="font-size: 14px; text-align: center; color: #e74c3c; margin: 20px;">This passcode will expire in 20 minutes.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <div style="text-align: center;">
                    <p style="font-size: 12px; color: #7f8c8d;">If you didn’t request this, please ignore this email or contact support.</p>
                    <p style="font-size: 12px; color: #7f8c8d;">&copy; ${new Date().getFullYear()} QueryNest. All rights reserved.</p>
                </div>
            </div>`,
    });

    res.status(200).json({
      message: "Passcode sent to your email. It will expire in 20 minutes.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  passcode verify
exports.verifyPasscode = async (req, res) => {
  try {
    const { clgemail, passcode } = req.body;

    const user = await User.findOne({ clgemail });
    if (!user) return res.status(404).json({ error: "User not found!" });

    // Check if the passcode is valid and not expired
    if (user.resetPasscode !== passcode) {
      return res.status(400).json({ error: "Invalid or expired passcode!" });
    } else if (user.resetPasscodeExpires < new Date()) {
      return res.status(400).json({ error: "Invalid or expired passcode!" });
    }
    res.status(200).json({ message: "Passcode verified successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Reset Password with Passcode
exports.resetPassword = async (req, res) => {
  try {
    const { clgemail, newPassword } = req.body;

    const user = await User.findOne({ clgemail });

    if (!user) return res.status(404).json({ error: "User not found!" });

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Clear reset fields
    user.resetPasscode = undefined;
    user.resetPasscodeExpires = undefined;

    await user.save();

    // Send confirmation email
    await transporter.sendMail({
      from: EMAIL_USER,
      to: clgemail,
      subject: "Password Reset Successful 🎉",
      html: `
                  <h1>Password Reset Successful</h1>
                  <p>Your password has been successfully reset. You can now log in with your new password.</p>
                  <p>If you didn’t perform this action, please contact support immediately.</p>
              `,
    });

    res
      .status(200)
      .json({ message: "Password reset successful! You can now log in." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all user
exports.getAllUser = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a user profile by ID
exports.getUserProfileById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid profile ID format." });
    }

    const profile = await UserProfile.findById(req.params.id).populate(
      "userId tags.tag questions answers"
    );
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a user profile by ID
exports.updateUserProfile = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid profile ID format." });
    }

    const profile = await UserProfile.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("userId tags.tag questions answers");

    if (!profile) return res.status(404).json({ message: "Profile not found" });

    res.json(profile);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a user profile by ID
exports.deleteUserProfile = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid profile ID format." });
    }

    const profile = await UserProfile.findByIdAndDelete(req.params.id);
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    res.json({ message: "Profile deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
