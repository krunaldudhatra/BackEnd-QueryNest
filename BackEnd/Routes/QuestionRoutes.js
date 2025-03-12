const express = require("express");
const { authenticateUser } = require("../Controllers/AuthController");
const router = express.Router();
const {createQuestion,
    getAllQuestions,
    getQuestionsByTag,
    likeQuestion,
    deleteQuestion,} = require("../Controllers/QuestionController");

router.post("/create",authenticateUser,createQuestion);





module.exports = router;
