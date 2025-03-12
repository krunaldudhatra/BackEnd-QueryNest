const mongoose = require("mongoose");

function createLeaderboardModel(tagName) {
    const leaderboardSchema = new mongoose.Schema(
        {
            id: { type: mongoose.Schema.Types.ObjectId, auto: true },
            time: { month: { type: Number, required: true }, year: { type: Number, required: true } },
            users: [
                {
                    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
                    points: { type: Number, default: 0 },
                    rank: { type: Number },
                },
            ],
        },
        { timestamps: true }
    );

    // Create or reuse the model
    const modelName = `${tagName}Leaderboard`;
    return mongoose.models[modelName] || mongoose.model(modelName, leaderboardSchema);
}
module.exports = createLeaderboardModel;  
