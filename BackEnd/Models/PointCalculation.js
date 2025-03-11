const mongoose = require('mongoose');

const PointCalculationSchema = new mongoose.Schema({
    durationInDays: { type: Number, required: true },
    percentageOfPoint: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PointCalculation', PointCalculationSchema);
