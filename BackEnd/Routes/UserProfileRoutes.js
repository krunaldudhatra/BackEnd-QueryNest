// Routes for UserProfile
const express = require("express");
const router = express.Router();
const {
  getAllUserProfile,
  createUserProfile,
  getUserProfileById,
  updateUserProfile,
  deleteUserProfile,
  getUserProfileByusername
} = require("../Controllers/UserProfileController");

const {authenticateUser}=require("../Controllers/AuthController")

// router.get("/", getAllUserProfile);
router.get("/profile", authenticateUser , getUserProfileById);
router.get("/:/username/:username",  getUserProfileByusername);
router.post("/createUserProfile",authenticateUser, createUserProfile);
router.put("/updateUserProfile",authenticateUser, updateUserProfile);
router.delete("/:id", deleteUserProfile);

module.exports = router;
