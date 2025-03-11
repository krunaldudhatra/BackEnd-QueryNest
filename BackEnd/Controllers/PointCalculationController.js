const PointCalculation = require("../Models/PointCalculation");

exports.createPointCalculation = async (req, res) => {
    try {
        const { durationInDays, percentageOfPoint } = req.body;
        if (!durationInDays || percentageOfPoint === undefined) {
            return res.status(400).json({ error: "Required fields: durationInDays, percentageOfPoint" });
        }
        res.status(201).json(await new PointCalculation({ durationInDays, percentageOfPoint }).save());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllPointCalculations = async (req, res) => {
    try {
        res.json(await PointCalculation.find());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getPointCalculationById = async (req, res) => {
    try {
        const point = await PointCalculation.findById(req.params.id);
        point ? res.json(point) : res.status(404).json({ error: "PointCalculation not found" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updatePointCalculation = async (req, res) => {
    try {
        res.json(await PointCalculation.findByIdAndUpdate(req.params.id, req.body, { new: true }));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deletePointCalculation = async (req, res) => {
    try {
        await PointCalculation.findByIdAndDelete(req.params.id);
        res.json({ message: "Point Calculation deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
