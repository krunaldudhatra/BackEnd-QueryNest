const express = require("express");
const router = express.Router();
const TagDetailController = require("../Controllers/TagDetailController");

router.post("/create", TagDetailController.createTagDetail);
router.get("/", TagDetailController.getAllTagDetails);
router.get("/:id", TagDetailController.getTagDetailById);
router.put("/:id", TagDetailController.updateTagDetail);
router.delete("/:id", TagDetailController.deleteTagDetail);

module.exports = router;
