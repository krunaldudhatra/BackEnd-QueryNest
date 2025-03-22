const express = require("express");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, EMAIL_USER,EMAIL_PASS } = process.env;
const mongoose = require("mongoose");
const User = require("../Models/User");
const UserProfile=require("../Models/UserProfile");
 
// const BASE_DOMAIN = "http://localhost:3000";
const BASE_DOMAIN="https://querynest-4tdw.onrender.com"

const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});


const sendBackupEmailVerification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }

    const { backupemail } = req.body;
    if (!backupemail) {
      return res.status(400).json({ error: "Backup email is required!" });
    }

    // Generate token with userId and backupemail
    const token = jwt.sign({ userId, backupemail }, JWT_SECRET, { expiresIn: "1h" });
    const verificationLink = `${BASE_DOMAIN}/api/UserProfile/verify-backup-email?token=${token}`;

    const mailOptions = {
      from: EMAIL_USER,
      to: backupemail,
      subject: "Verify Your Backup Email - QueryNest",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 500px; margin: auto; background-color: #fbf5ee;">
          <h2 style="color: #2c3e50; text-align: center;">Verify Your Backup Email</h2>
          <p style="font-size: 16px; text-align: center;">Hello <strong>${user.name}</strong> (@${user.username}),</p>
          <p style="font-size: 16px; text-align: center;">Click the button below to verify your backup email:</p>
          <div style="text-align: center; margin: 20px;">
            <a href="${verificationLink}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; font-size: 18px; border-radius: 5px;">Yes, It's Me</a>
          </div>
          <p style="font-size: 12px; text-align: center; color: #7f8c8d;">If you didn’t request this, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: `Backup email verification to email:${backupemail} sent successfully .` });
  } catch (error) {
    console.error("Error sending backup email verification:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const verifyBackupEmailVerification = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: "Invalid or missing token!" });
    }

    // Verify token and extract userId and backupemail
    const decoded = jwt.verify(token, JWT_SECRET);
    const { userId, backupemail } = decoded;
    const userProfile = await UserProfile.findOne({ userid: userId });
    
    if (!userProfile) {
      return res.status(404).json({ error: "userProfile not found!" });
    }

    // Update user profile with the verified backup email
    userProfile.backupemail = backupemail;
     await userProfile.save();

    // Send confirmation email
    const confirmationMailOptions = {
      from: EMAIL_USER,
      to: backupemail,
      subject: "Backup Email Successfully Verified - QueryNest",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 500px; margin: auto; background-color: #e3f2fd;">
          <h2 style="color: #2c3e50; text-align: center;">Backup Email Verified Successfully!</h2>
          <p style="font-size: 16px; text-align: center;">Hello <strong>${userProfile.name}</strong> (@${userProfile.username}),</p>
          <p style="font-size: 16px; text-align: center;">Your backup email <strong>${backupemail}</strong> has been successfully verified and added to your account.</p>
          <div style="text-align: center; margin: 20px;">
            <p style="color: #2c3e50; font-size: 14px;">If you didn’t request this change, please contact support immediately.</p>
          </div>
          <p style="font-size: 12px; text-align: center; color: #7f8c8d;">Thank you for using QueryNest.</p>
        </div>
      `,
    };

    await transporter.sendMail(confirmationMailOptions);

    res.send("<h1>Backup Email Verified Successfully! 🎉</h1>");
  } catch (error) {
    console.log("Error:"+error)
    res.status(400).send("<h1>Invalid or Expired Link!</h1>");
  }
};

module.exports = { verifyBackupEmailVerification, sendBackupEmailVerification };
