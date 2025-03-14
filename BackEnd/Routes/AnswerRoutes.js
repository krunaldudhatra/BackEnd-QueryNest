const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../Controllers/AuthController");

const {createAnswer} = require("../Controllers/AnswerController");

router.post("/create",authenticateUser, createAnswer);
router.get("/", AnswerController.getAllAnswers);
router.get("/:id", AnswerController.getAnswerById);
router.put("/:id", AnswerController.updateAnswer);
router.delete("/:id", AnswerController.deleteAnswer);

router.get("/userAnswer/:userId", AnswerController.getAnswersByUserId);


module.exports = router;
