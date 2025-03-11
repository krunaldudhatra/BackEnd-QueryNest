const Answer = require("../Models/Answer.js");

exports.createAnswer = async (req, res) => {
    try {
        const { userId, questionId, content } = req.body;

        if (!userId || !questionId || !content) {
            return res.status(400).json({ error: "All required fields (userId, questionId, content) must be provided." });
        }

        const answer = new Answer({ userId, questionId, content });
        const savedAnswer = await answer.save();
        res.status(201).json(savedAnswer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllAnswers = async (req, res) => {
    try {
        const answers = await Answer.find().populate("userId questionId");
        res.json(answers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAnswerById = async (req, res) => {
    try {
        const answer = await Answer.findById(req.params.id).populate("userId questionId");
        if (!answer) return res.status(404).json({ error: "Answer not found" });
        res.json(answer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


 

exports.getAnswersByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate userId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid userId format." });
        }

        // Fetch all answers for the given userId
        const answers = await Answer.find({ userId })
            .populate("questionId", "userId") // Get the userId of the question
            .select("_id userId questionId content");

        // Format response to include question's userId, questionId, and answerId
        const formattedAnswers = answers.map(answer => ({
            answerId: answer._id,
            questionId: answer.questionId?._id, // Check if populated
            questionedUserId: answer.questionId?.userId, // Get question's userId
            content: answer.content
        }));

        res.json(formattedAnswers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.updateAnswer = async (req, res) => {
    try {
        const updatedAnswer = await Answer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedAnswer);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteAnswer = async (req, res) => {
    try {
        await Answer.findByIdAndDelete(req.params.id);
        res.json({ message: "Answer deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
