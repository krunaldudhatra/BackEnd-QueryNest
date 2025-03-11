const Question = require("../Models/Question");

exports.createQuestion = async (req, res) => {
    try {
        const { userId, TagId, question } = req.body;

        if (!userId || !TagId || !question) {
            return res.status(400).json({ error: "Required fields: userId, TagId, question" });
        }

        const newQuestion = new Question({ userId, TagId, question });
        await newQuestion.save();

        res.status(201).json(newQuestion);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all questions
exports.getAllQuestions = async (req, res) => {
    try {
        res.json(await Question.find().populate("userId answers"));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get question by ID
exports.getQuestionById = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id).populate("userId answers");
        question ? res.json(question) : res.status(404).json({ error: "Question not found" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

 
// Get all questions for a specific user
exports.getQuestionsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate userId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid userId format." });
        }

        // Fetch questions for the given userId
        const questions = await Question.find({ userId })
            .populate("userId", "name username email") // Populate user details
            .populate("TagId", "tagName") // Populate tag details
            .populate("answers"); // Populate related answers

        res.json(questions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Update question
exports.updateQuestion = async (req, res) => {
    try {
        res.json(await Question.findByIdAndUpdate(req.params.id, req.body, { new: true }));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete question
exports.deleteQuestion = async (req, res) => {
    try {
        await Question.findByIdAndDelete(req.params.id);
        res.json({ message: "Question deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
