const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String },
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: "Board" },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  token: { type: String, required: true },
  role: { type: String, enum: ["viewer", "editor"], default: "viewer" },
  status: { type: String, enum: ["pending", "accepted"], default: "pending" },
  createdAt: { type: Date, default: Date.now, expires: "7d" } // Auto-delete after 7 days
});



module.exports = mongoose.model("Invite", inviteSchema);
