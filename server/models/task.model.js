const mongoose = require("mongoose");

const checklistItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const taskAssignmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["viewer", "commenter", "editor"],
      default: "viewer",
      required: true,
    },
    permissions: {
      allActions: { type: Boolean, default: false },
      reorder: { type: Boolean, default: false },
      moveTask: { type: Boolean, default: false },
    },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  status: {
    type: String,
    default: "todo",
  },
  dueDate: {
    type: String,
  },
  /**
   * Legacy single assignee (free text). Prefer `assignments`.
   */
  assignee: {
    type: String,
  },
  assignments: {
    type: [taskAssignmentSchema],
    default: [],
  },
  labels: {
    type: [String],
    default: [],
  },
  checklist: {
    type: [checklistItemSchema],
    default: [],
  },
  listId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "List",
    required: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  progress: {
    type: Number,
    default: 0,
  },
  autoDone: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);
module.exports = Task;
