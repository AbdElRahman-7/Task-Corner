import mongoose from "mongoose";

const inviteSchema = new mongoose.Schema({
  email: { type: String, required: true },
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: "Board" },
  token: { type: String, required: true },
  status: { type: String, default: "pending" },
});

export default mongoose.model("Invite", inviteSchema);
