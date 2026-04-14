const mongoose = require("mongoose");

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
  }
}, { timestamps: true });

const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);
module.exports = Task;
