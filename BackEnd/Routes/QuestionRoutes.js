const express = require("express");
const { authenticateUser } = require("../Controllers/AuthController");
const router = express.Router();
const {
  createQuestion,
  toggleLikeOnQuestion,
  getQuestionById,
  getQuestionsByTag,
  getAllQuestions,
  getAllQuestionsByUsername,
  getQuestionsBySenderAndTagMatch
} = require("../Controllers/QuestionController");
 
router.post("/create", authenticateUser, createQuestion);  //create question
router.post("/getquestion/:questionId", authenticateUser, getQuestionById);
router.post("/togglelike",authenticateUser,toggleLikeOnQuestion)    //remove like 
router.get("/tagQuestion",getQuestionsByTag); //to get all specific tag question
router.get("/userQuestion/:username",authenticateUser, getAllQuestionsByUsername); // to view any of user's asked by username
router.get("/allQuestions",getAllQuestions)  //retrive all questions
router.get("/tagmatchquestion",authenticateUser,getQuestionsBySenderAndTagMatch) 

router.get("/")



module.exports = router;
