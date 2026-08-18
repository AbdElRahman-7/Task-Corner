const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      role: { type: String, enum: ["viewer", "editor"], default: "viewer" }
    }
  ],
}, { timestamps: true });

const Workspace = mongoose.models.Workspace || mongoose.model("Workspace", workspaceSchema);
module.exports = Workspace;
