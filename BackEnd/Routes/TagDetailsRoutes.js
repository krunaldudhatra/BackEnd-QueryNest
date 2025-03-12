const express = require("express");
const router = express.Router();
const {
  createTagDetail,
  getAllTagDetails,
  getTagDetailById,
  updateTagDetail,
  deleteTagDetail,
} = require("../Controllers/TagDetailController");

// const {authAdmin}=require("../Controllers/AuthController")

router.post("/create", createTagDetail);
router.get("/", getAllTagDetails);
router.get("/:id", getTagDetailById);
router.put("/:id", updateTagDetail);
router.delete("/:id", deleteTagDetail);

module.exports = router;
