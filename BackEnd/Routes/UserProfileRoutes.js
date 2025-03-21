// Routes for UserProfile
const express = require("express");
const router = express.Router();
const {
  createUserProfile,
  getUserProfileById,
  updateUserProfile,
  deleteUserProfile,
  getUserProfileByusername,
  searchUsers,
  updateUserTags
} = require("../Controllers/UserProfileController");

const {authenticateUser}=require("../Controllers/AuthController")
const { sendBackupEmailVerification, verifyBackupEmailVerification } = require("../Controllers/BackupVerifyController");

router.get("/me", authenticateUser , getUserProfileById);
router.get("/searchUser/search",authenticateUser, searchUsers);
router.get("/username/:username",  getUserProfileByusername);
router.post("/createUserProfile",authenticateUser, createUserProfile);
router.put("/updateUserProfile",authenticateUser, updateUserProfile);
router.delete("/:id", deleteUserProfile);

router.put("/tagchange",authenticateUser , updateUserTags);

router.post("/request-backup-verification" ,authenticateUser, sendBackupEmailVerification);
router.get("/verify-backup-email", authenticateUser , verifyBackupEmailVerification);

module.exports = router;
