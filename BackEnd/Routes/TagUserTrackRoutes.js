const express = require("express");
const router = express.Router();
const TagUserTrackController = require("../Controllers/TagUserTrackController");

router.post("/create", TagUserTrackController.createTagUserTrack);
router.get("/", TagUserTrackController.getAllTagUserTracks);
router.get("/:id", TagUserTrackController.getTagUserTrackById);
router.put("/:id", TagUserTrackController.updateTagUserTrack);
router.delete("/:id", TagUserTrackController.deleteTagUserTrack);

module.exports = router;
