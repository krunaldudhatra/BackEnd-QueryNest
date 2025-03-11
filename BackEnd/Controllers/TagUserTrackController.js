const TagUserTrack = require("../Models/TagUserTrack");

exports.createTagUserTrack = async (req, res) => {
    try {
        const { tagId, userId } = req.body;
        if (!tagId || !userId) {
            return res.status(400).json({ error: "Required fields: tagId, userId" });
        }
        res.status(201).json(await new TagUserTrack({ tagId, userId }).save());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllTagUserTracks = async (req, res) => {
    try {
        res.json(await TagUserTrack.find().populate("tagId userId"));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getTagUserTrackById = async (req, res) => {
    try {
        const tagUserTrack = await TagUserTrack.findById(req.params.id).populate("tagId userId");
        tagUserTrack ? res.json(tagUserTrack) : res.status(404).json({ error: "TagUserTrack not found" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateTagUserTrack = async (req, res) => {
    try {
        res.json(await TagUserTrack.findByIdAndUpdate(req.params.id, req.body, { new: true }));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteTagUserTrack = async (req, res) => {
    try {
        await TagUserTrack.findByIdAndDelete(req.params.id);
        res.json({ message: "TagUserTrack deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
