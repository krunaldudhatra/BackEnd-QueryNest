const mongoose = require("mongoose");

const SportsSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  time: { month: { type: Number, required: true }, year: { type: Number, required: true } },
  users: [
    { userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserDetails", required: true }, points: { type: Number, default: 0 }, rank: { type: Number } }
  ]
}, { timestamps: true });

module.exports = {
    
    Sports: mongoose.model("Sports", SportsSchema),
   
  };
  