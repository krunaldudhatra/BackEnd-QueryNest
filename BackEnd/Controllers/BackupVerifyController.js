const express = require("express");
const router = express.Router();
const BASE_DOMAIN="https://querynest-4tdw.onrender.com"


const sendBackupEmailVerification = async (user) => {
    try {
      const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
  
      const verificationLink = `${BASE_DOMAIN}/api/UserProfile/verify-backup-email?token=${token}`;
  
      const mailOptions = {
        from: EMAIL_USER,
        to: user.backupemail,
        subject: "Verify Your Backup Email - QueryNest",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 500px; margin: auto; background-color: #fbf5ee;">
            <h2 style="color: #2c3e50; text-align: center;">Verify Your Backup Email</h2>
            <p style="font-size: 16px; text-align: center;">Click the button below to verify your backup email:</p>
            <div style="text-align: center; margin: 20px;">
              <a href="${verificationLink}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; font-size: 18px; border-radius: 5px;">Yes, It's Me</a>
              
            </div>
            <p style="font-size: 12px; text-align: center; color: #7f8c8d;">If you didn’t request this, please ignore this email.</p>
          </div>
        `,
      };
  
      await transporter.sendMail(mailOptions);
      console.log("Backup email verification sent.");
    } catch (error) {
      console.error("Error sending backup email verification:", error.message);
    }
  };



const verifyBackuEmailVerification= async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: "Invalid or missing token!" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }

    // Update backup email verification status
    user.backupEmailVerified = true;
    await user.save();

    res.send("<h1>Backup Email Verified Successfully! 🎉</h1>");
  } catch (error) {
    res.status(400).send("<h1>Invalid or Expired Link!</h1>");
  }
};

module.exports = { verifyBackuEmailVerification, sendBackupEmailVerification };