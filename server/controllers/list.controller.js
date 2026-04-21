const List = require("../models/list.model");
const Board = require("../models/board.model");
const Task = require("../models/task.model");

// @desc    Create a new list
// @route   POST /api/lists
// @access  Private
const createList = async (req, res) => {
  try {
    const { boardId, title } = req.body;

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: "Board not found" });
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

// @desc    Update a list
// @route   PUT /api/lists/:id
// @access  Private
const updateList = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const list = await List.findById(id);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    list.title = title || list.title;
    const updatedList = await list.save();

    res.json(updatedList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a list
// @route   DELETE /api/lists/:id
// @access  Private
const deleteList = async (req, res) => {
  try {
    const { id } = req.params;

    const list = await List.findById(id);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    // Delete all tasks in this list
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
