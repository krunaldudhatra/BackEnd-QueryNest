const express = require("express");
const router = express.Router();
const {createQuestion,
    getAllQuestions,
    getQuestionsByTag,
    likeQuestion,
    deleteQuestion,} = require("../Controllers/QuestionController");

router.post("/create",createQuestion);





module.exports = router;
