const Board = require("../models/board.model");
const List = require("../models/list.model");
const Task = require("../models/task.model");

// @desc    Get all boards for user
const getBoards = async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [{ user: req.user._id }, { members: req.user._id }],
    });
    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get complete board data (Lists and Tasks)
const getBoardData = async (req, res) => {
  try {
    const { boardId } = req.params;
    const board = await Board.findOne({
      _id: boardId,
      $or: [{ user: req.user._id }, { members: req.user._id }],
    });
    
    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    const lists = await List.find({ boardId });
    const listIds = lists.map(l => l._id);
    const tasks = await Task.find({ listId: { $in: listIds } });

    res.json({
      board,
      lists,
      tasks
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new board
const createBoard = async (req, res) => {
  try {
    const { title } = req.body;
    const board = await Board.create({
      title,
      user: req.user._id,
      members: [req.user._id],
    });

    // Create default lists for new board
    const defaultLists = ["Todo", "In Progress", "Done"];
    const createdLists = await Promise.all(
      defaultLists.map((lt, index) => 
        List.create({ title: lt, boardId: board._id, order: index })
      )
    );

    res.status(201).json({
      board,
      lists: createdLists,
      tasks: []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete board
const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findOne({ _id: req.params.id, user: req.user._id });
    if (!board) return res.status(404).json({ message: "Board not found" });

    const lists = await List.find({ boardId: board._id });
    const listIds = lists.map(l => l._id);

    await Task.deleteMany({ listId: { $in: listIds } });
    await List.deleteMany({ boardId: board._id });
    await Board.deleteOne({ _id: board._id });

    res.json({ message: "Board removed", boardId: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBoards,
  getBoardData,
  createBoard,
  deleteBoard
};
