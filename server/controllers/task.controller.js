const Task = require("../models/task.model");
const List = require("../models/list.model");

// @desc    Create a new task
const createTask = async (req, res) => {
  try {
    const { listId, title, order } = req.body;
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
    const task = await Task.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json({ message: "Task removed", taskId: id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  updateTask,
  deleteTask
};
