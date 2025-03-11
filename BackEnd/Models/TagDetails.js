const mongoose = require('mongoose');
const TagDetailSchema = new mongoose.Schema({
    tagName: { type: String, required: true, unique: true },
    tagPoint: { type: Number, required: true }, createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('TagDetail', TagDetailSchema);
