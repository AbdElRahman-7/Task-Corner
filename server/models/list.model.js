const mongoose = require("mongoose");

const listSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Board",
    required: true,
  },
  order: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

const List = mongoose.models.List || mongoose.model("List", listSchema);
module.exports = List;
