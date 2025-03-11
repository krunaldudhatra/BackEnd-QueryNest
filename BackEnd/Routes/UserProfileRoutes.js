// Routes for UserDetails
const express = require("express");
const router = express.Router();
const {
  getAllUserProfile,
  createUserProfile,
  getUserProfileById,
  updateUserProfile,
  deleteUserProfile,
} = require("../Controllers/UserProfileController");

router.get("/", getAllUserProfile);
router.get("/:id", getUserProfileById);
router.post("/createUserProfile", createUserProfile);
router.put("/:id", updateUserProfile);
router.delete("/:id", deleteUserProfile);

module.exports = router;
