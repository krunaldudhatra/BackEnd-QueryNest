const express = require("express");
const router = express.Router();
const QuestionController = require("../Controllers/QuestionController");

router.post("/create", QuestionController.createQuestion);
router.get("/", QuestionController.getAllQuestions);
router.get("/:id", QuestionController.getQuestionById);
router.put("/:id", QuestionController.updateQuestion);
router.delete("/:id", QuestionController.deleteQuestion);

router.get("/userQuestions/:userId",QuestionController.getQuestionsByUserId);


module.exports = router;
