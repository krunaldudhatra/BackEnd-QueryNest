const express = require("express");
const router = express.Router();
const AnswerController = require("../Controllers/AnswerController");

router.post("/create", AnswerController.createAnswer);
router.get("/", AnswerController.getAllAnswers);
router.get("/:id", AnswerController.getAnswerById);
router.put("/:id", AnswerController.updateAnswer);
router.delete("/:id", AnswerController.deleteAnswer);

router.get("/userAnswer/:userId", AnswerController.getAnswersByUserId);


module.exports = router;
