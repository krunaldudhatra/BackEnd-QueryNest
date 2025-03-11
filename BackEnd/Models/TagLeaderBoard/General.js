const mongoose = require("mongoose");

const GeneralQuerySchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  time: { month: { type: Number, required: true }, year: { type: Number, required: true } },
  users: [
    { userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserDetails", required: true }, points: { type: Number, default: 0 }, rank: { type: Number } }
  ]
}, { timestamps: true });




module.exports = {
  GeneralQuery: mongoose.model("GeneralQuery", GeneralQuerySchema),
  
};
