const mongoose = require("mongoose");
const User = require("../Models/User");
const Temp = require("../Models/Temp");
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

    // Create new user
    const newUser = new Temp({
      name,
      username,
      clgemail,
      password: hashedPassword,
      otp,
      otpExpires
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

      // Find user in Temp schema
      const tempUser = await Temp.findOne({ clgemail });

      if (!tempUser) return res.status(404).json({ error: "User not found!" });

      // Check OTP and expiration
      if (tempUser.otp !== otp || tempUser.otpExpires < new Date()) {
        return res.status(400).json({ error: "Invalid or expired OTP!" });
      }

      // Create a new user in the User schema
      const newUser = new User({
        name: tempUser.name,
        username: tempUser.username,
        clgemail: tempUser.clgemail,
        password: tempUser.password,
        verified: true, // Mark as verified
      });

      await newUser.save();

      // Remove the user from Temp schema
      await Temp.deleteOne({ clgemail });

      // Send confirmation email
      await transporter.sendMail({
        from: EMAIL_USER,
        to: clgemail,
        subject: "Registration Successful 🎉",
        html: `<h1>Congratulations, ${tempUser.name}!</h1>
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

    user.otp = newOTP;
    user.otpExpires = otpExpires;

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
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({
      $or: [{ clgemail: email }, { backupemail: email }],
    });
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
      { userId: user._id, email:user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      message: "Login successful!",
      userId: user._id,
      email:email,
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Request Password Reset (Send Passcode)
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by either clgemail or backupemail
    const user = await User.findOne({
      $or: [{ clgemail: email }, { backupemail: email }],
    });

    if (!user) return res.status(404).json({ error: "User not found!" });

    // Generate passcode and set expiration
    const resetPasscode = generateOTP(); // 6-digit passcode
    const passcodeExpires = new Date(Date.now() + 20 * 60 * 1000); // Expires in 20 minutes

    // Save passcode & expiration in the database
    user.resetPasscode = resetPasscode;
    user.resetPasscodeExpires = passcodeExpires;
    await user.save();

    // Determine the recipient email
    const recipientEmail = user.clgemail || user.backupemail;

    // Send passcode email
    if (recipientEmail) {
      await transporter.sendMail({
        from: EMAIL_USER,
        to: recipientEmail,
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
        message: `Passcode sent to ${recipientEmail}. It will expire in 20 minutes.`,
      });
    } else {
      res.status(400).json({ error: "No valid email found to send passcode." });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Passcode Verification
exports.verifyPasscode = async (req, res) => {
  try {
    const { email, passcode } = req.body;
    if (!email || !passcode) {
      return res.status(400).json({ error: "Email and passcode are required!" });
    }

    // Find user by college or backup email
    const user = await User.findOne({
      $or: [{ clgemail: email }, { backupemail: email }],
    });

    if (!user) return res.status(404).json({ error: "User not found!" });

    // Validate passcode expiration
    if (!user.resetPasscode || user.resetPasscodeExpires < new Date()) {
      return res.status(400).json({ error: "Invalid or expired passcode!" });
    }

    // Check if passcode matches
    if (user.resetPasscode != passcode) {
      return res.status(400).json({ error: "Incorrect passcode!" });
    }
    return res.status(200).json({ message: "Passcode verified successfully!" });
  } catch (err) {
    console.error("Server error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};


// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ error: "Email and new password are required!" });
        }

        // Find user by college or backup email
        const user = await User.findOne({
            $or: [{ clgemail: email }, { backupemail: email }],
        });

        if (!user) {
            return res.status(404).json({ error: "User not found!" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user's password
        user.password = hashedPassword;

        // Clear reset passcode fields (if reset flow is used)
        user.resetPasscode = null;
        user.resetPasscodeExpires = null;

        await user.save();

        // Determine primary and fallback email
        const primaryEmail = user.clgemail;
        const fallbackEmail = user.backupemail;

        // Send confirmation email
        try {
            transporter.sendMail({
            from: EMAIL_USER,
            to: primaryEmail || fallbackEmail,
            subject: "Password Reset Successful 🎉",
            html: `
                    <h1>Password Reset Successful</h1>
                    <p>Your password has been successfully reset. You can now log in with your new password.</p>
                    <p>If you didn’t perform this action, please contact support immediately.</p>
                `,
          });
        } catch (emailError) {
            console.error("Error sending email to primary:", emailError.message);

            if (primaryEmail && fallbackEmail) {
                try {
                    await transporter.sendMail({
                        from: EMAIL_USER,
                        to: fallbackEmail,
                        subject: "Password Reset Successful 🎉",
                        html: `
                            <h1>Password Reset Successful</h1>
                            <p>Your password has been successfully reset. You can now log in with your new password.</p>
                            <p>If you didn’t perform this action, please contact support immediately.</p>
                        `,
                    });
                } catch (backupEmailError) {
                    console.error("Error sending email to backup:", backupEmailError.message);
                }
            }
        }

        return res.status(200).json({ message: "Password reset successful!" });

    } catch (error) {
        console.error("Server error:", error.message);
        return res.status(500).json({ error: "Internal server error" });
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
exports.getUserById = async (req, res) => {
  try {
    const userid = req.user.userId;
    const clgemail = req.user.email;
    if (!mongoose.Types.ObjectId.isValid(userid)) {
      return res.status(400).json({ error: "Invalid user ID format." });
    }

    const user = await User.findById(userid)
    if (!user) return res.status(404).json({ message: "Profile not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
