const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../Controllers/AuthController");

const {createAnswer,getAllAnswers,getAnswerById,deleteAnswer,updateAnswer,getAnswersByUserId,getAllAnswersByUsername} = require("../Controllers/AnswerController");

router.post("/create",authenticateUser, createAnswer);
router.get("/", getAllAnswers);
router.get("/getanswer/:answerId",authenticateUser,getAnswerById);
router.get("/userAnswer/:username",authenticateUser, getAllAnswersByUsername);
router.put("/:id",updateAnswer);
router.delete("/:id",deleteAnswer);

router.get("/userAnswer/:userId",getAnswersByUserId);


module.exports = router;
