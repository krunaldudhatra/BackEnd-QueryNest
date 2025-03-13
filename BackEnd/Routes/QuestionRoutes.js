const express = require("express");
const { authenticateUser } = require("../Controllers/AuthController");
const router = express.Router();
const {
  createQuestion,
  likeTheQuestionByUser,
  removeLikeFromQuestion,

  getQuestionsByTag,
  getAllQuestions,
  getAllQuestionsByUsername,
  getQuestionsBySenderAndTagMatch
} = require("../Controllers/QuestionController");
 
router.post("/create", authenticateUser, createQuestion);  //create question
router.post("/likeQuestion",authenticateUser,likeTheQuestionByUser)  //give like
router.post("/removelike",authenticateUser,removeLikeFromQuestion)  //remove like 
router.get("/tagQuestion",getQuestionsByTag); //to get all specific tag question
router.get("/userQuestion/:username",authenticateUser, getAllQuestionsByUsername); // to view any of user's asked by username
router.get("/allQuestions",getAllQuestions)  //retrive all questions
router.get("/question",getQuestionsBySenderAndTagMatch) 

router.get("/")



module.exports = router;
