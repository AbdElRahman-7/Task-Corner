const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema({
  email: { type: String, required: true },
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: "Board" },
  token: { type: String, required: true },
  status: { type: String, enum: ["pending", "accepted"], default: "pending" },
  createdAt: { type: Date, default: Date.now, expires: "7d" } // Auto-delete after 7 days
});

module.exports = mongoose.model("Invite", inviteSchema);
