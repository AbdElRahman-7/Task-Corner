const List = require("../models/list.model");
const Board = require("../models/board.model");
const Task = require("../models/task.model");

// @desc    Create a new list
// @route   POST /api/lists
// @access  Private
const createList = async (req, res) => {
  try {
    const { boardId, title } = req.body;

    const board = await Board.findOne({ 
      _id: boardId, 
      $or: [
        { user: req.user._id },
        { members: { $elemMatch: { user: req.user._id, role: "editor" } } }
      ]
    });
    
    if (!board) {
      return res.status(403).json({ message: "No permission to create lists on this board" });
    }

    const list = await List.create({
      title,
      boardId,
      user: req.user._id,
    });

    res.status(201).json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateList = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const list = await List.findById(id);
    if (!list) return res.status(404).json({ message: "List not found" });

    const board = await Board.findOne({ 
      _id: list.boardId, 
      $or: [
        { user: req.user._id },
        { members: { $elemMatch: { user: req.user._id, role: "editor" } } }
      ]
    });
    if (!board) return res.status(403).json({ message: "No permission to update this list" });

    list.title = title || list.title;
    const updatedList = await list.save();

    res.json(updatedList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteList = async (req, res) => {
  try {
    const { id } = req.params;

    const list = await List.findById(id);
    if (!list) return res.status(404).json({ message: "List not found" });

    const board = await Board.findOne({ 
      _id: list.boardId, 
      $or: [
        { user: req.user._id },
        { members: { $elemMatch: { user: req.user._id, role: "editor" } } }
      ]
    });
    if (!board) return res.status(403).json({ message: "No permission to delete this list" });

    await Task.deleteMany({ listId: id });
    await list.deleteOne();

    res.json({ message: "List removed", listId: id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createList,
  updateList,
  deleteList,
};
