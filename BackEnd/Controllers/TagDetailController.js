const TagDetail = require("../Models/TagDetails");

exports.createTagDetail = async (req, res) => {
    try {

        const { tagName, tagPoint ,username,password } = req.body;
        if (username === "admin1234" && password === "1234Admin") {
             
          } else {
            res.status(403).json({ message: "Forbidden: Invalid credentials for Admin Access" });
          }

        if (tagName===undefined || tagPoint === undefined) {
            return res.status(400).json({ error: "Required fields: tagName, tagPoint" });
        }
        res.status(201).json(await new TagDetail({ tagName, tagPoint }).save());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllTagDetails = async (req, res) => {
    try {
        res.json(await TagDetail.find());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getTagDetailById = async (req, res) => {
    try {
        const tagDetail = await TagDetail.findById(req.params.id);
        tagDetail ? res.json(tagDetail) : res.status(404).json({ error: "TagDetail not found" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateTagDetail = async (req, res) => {
    try {
        res.json(await TagDetail.findByIdAndUpdate(req.params.id, req.body, { new: true }));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteTagDetail = async (req, res) => {
    try {
        await TagDetail.findByIdAndDelete(req.params.id);
        res.json({ message: "TagDetail deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
