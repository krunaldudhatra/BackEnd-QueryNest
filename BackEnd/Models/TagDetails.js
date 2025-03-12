const mongoose = require('mongoose');

const TagDetailSchema = new mongoose.Schema({
    tagName: { type: String, required: true, unique: true },
    tagPoint: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
});

// Avoid model overwrite
const TagDetail = mongoose.models.TagDetail || mongoose.model('TagDetail', TagDetailSchema);

module.exports = TagDetail;
