const Task = require("../models/task.model");
const List = require("../models/list.model");
const Board = require("../models/board.model");

// @desc    Create a new task
const createTask = async (req, res) => {
  try {
    const { listId, title, order } = req.body;
    
    // Find list to get boardId
    const list = await List.findById(listId);
    if (!list) return res.status(404).json({ message: "List not found" });

    // Check board permissions
    const board = await Board.findOne({ 
      _id: list.boardId, 
      $or: [
        { user: req.user._id },
        { members: { $elemMatch: { user: req.user._id, role: "editor" } } }
      ]
    });
    if (!board) return res.status(403).json({ message: "No editor permission on this board" });

    const task = await Task.create({
      title,
      listId,
      order,
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a task (title, status, priority, description, listId, order)
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const currentTask = await Task.findById(id);
    if (!currentTask) return res.status(404).json({ message: "Task not found" });

    const list = await List.findById(currentTask.listId);
    if (!list) return res.status(404).json({ message: "List not found" });

    const board = await Board.findOne({ 
      _id: list.boardId, 
      $or: [
        { user: req.user._id },
        { members: { $elemMatch: { user: req.user._id, role: "editor" } } }
      ]
    });
    if (!board) return res.status(403).json({ message: "No editor permission on this board" });

    const task = await Task.findByIdAndUpdate(id, req.body, { new: true });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const currentTask = await Task.findById(id);
    if (!currentTask) return res.status(404).json({ message: "Task not found" });

    const list = await List.findById(currentTask.listId);
    if (!list) return res.status(404).json({ message: "List not found" });

    const board = await Board.findOne({ 
      _id: list.boardId, 
      $or: [
        { user: req.user._id },
        { members: { $elemMatch: { user: req.user._id, role: "editor" } } }
      ]
    });
    if (!board) return res.status(403).json({ message: "No editor permission on this board" });

    await Task.findByIdAndDelete(id);
    res.json({ message: "Task removed", taskId: id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Move task to another list/position
const moveTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { toListId, newIndex } = req.body;

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Permissions check
    const list = await List.findById(task.listId);
    const toList = await List.findById(toListId);
    if (!toList) return res.status(404).json({ message: "Destination list not found" });

    const board = await Board.findOne({ 
      _id: list.boardId, 
      $or: [
        { user: req.user._id },
        { members: { $elemMatch: { user: req.user._id, role: "editor" } } }
      ]
    });
    if (!board) return res.status(403).json({ message: "No editor permission" });

    // Update listId, order AND status based on the list title
    const status = toList.title.toLowerCase();
    task.listId = toListId;
    task.order = newIndex;
    task.status = status;
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  updateTask,
  deleteTask,
  moveTask
};
