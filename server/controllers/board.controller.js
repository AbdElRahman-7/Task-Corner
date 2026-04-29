const Board = require("../models/board.model");
const List = require("../models/list.model");
const Task = require("../models/task.model");
const User = require("../models/user.model");
const Invite = require("../models/invite.model");
const crypto = require("crypto");

// @desc    Get boards (optionally filter by archived status)
const getBoards = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {
      $or: [{ user: req.user._id }, { "members.user": req.user._id }],
    };

    if (status === "archived") {
      query.isArchived = true;
    } else if (status === "active") {
      query.isArchived = false;
    }

    const boards = await Board.find(query).populate("user", "username email");
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
      $or: [{ user: req.user._id }, { "members.user": req.user._id }],
    })
      .populate("user", "username email")
      .populate("members.user", "username email");

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    // 🔥 FIX هنا
    let lists = await List.find({ boardId: board._id }).sort({ order: 1 });

    const requiredLists = ["Todo", "In Progress", "Done", "Custom"];

    for (let i = 0; i < requiredLists.length; i++) {
      const exists = lists.some((l) => l.title === requiredLists[i]);

      if (!exists) {
        const newList = await List.create({
          title: requiredLists[i],
          boardId: board._id,
          order: i,
        });

        lists.push(newList);
      }
    }

    const listIds = lists.map((l) => l._id);

    const tasks = await Task.find({ listId: { $in: listIds } }).populate(
      "assignments.user",
      "username email"
    );

    const invites = await Invite.find({ boardId, status: "pending" });

    res.json({
      board,
      lists,
      tasks,
      invites,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new board
const createBoard = async (req, res) => {
  try {
    const { title, members } = req.body;

    const board = await Board.create({
      title,
      user: req.user._id,
      members: [{ user: req.user._id, role: "editor" }],
    });

    if (members && Array.isArray(members)) {
      for (const m of members) {
        if (!m.email) continue;

        const normalizedEmail = m.email.toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (user) {
          const isAlreadyMember = board.members.some(
            (member) => member.user?.toString() === user._id.toString()
          );

          if (!isAlreadyMember) {
            board.members.push({
              user: user._id,
              role: m.role || "viewer",
            });
          }
        } else {
          const token = crypto.randomBytes(32).toString("hex");

          await Invite.create({
            email: normalizedEmail,
            name: m.name,
            boardId: board._id,
            token,
            role: m.role || "viewer",
          });
        }
      }

      await board.save();
    }

    // ممكن تضيف Custom هنا لو عايز البورد الجديد يطلع بيه جاهز
    const defaultLists = ["Todo", "In Progress", "Done", "Custom"];

    const createdLists = await Promise.all(
      defaultLists.map((lt, index) =>
        List.create({ title: lt, boardId: board._id, order: index })
      )
    );

    res.status(201).json({
      board: await Board.findById(board._id).populate(
        "members.user",
        "username email"
      ),
      lists: createdLists,
      tasks: [],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// باقي الكود زي ما هو بدون تغيير
const deleteBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const board = await Board.findOne({ _id: boardId, user: req.user._id });
    if (!board)
      return res.status(404).json({ message: "Board not found or unauthorized" });

    const lists = await List.find({ boardId: board._id });
    const listIds = lists.map((l) => l._id);

    await Task.deleteMany({ listId: { $in: listIds } });
    await List.deleteMany({ boardId: board._id });
    await Board.deleteOne({ _id: board._id });

    res.json({ message: "Board removed", boardId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const updates = req.body;

    const board = await Board.findOneAndUpdate(
      {
        _id: boardId,
        $or: [
          { user: req.user._id },
          {
            members: {
              $elemMatch: { user: req.user._id, role: "editor" },
            },
          },
        ],
      },
      { $set: updates },
      { new: true }
    ).populate("members.user", "username email");

    if (!board) {
      return res
        .status(404)
        .json({ message: "Board not found or unauthorized" });
    }

    res.json(board);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateMemberRole = async (req, res) => {
  try {
    const { boardId, userId } = req.params;
    const { role } = req.body;

    if (!["viewer", "editor"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const board = await Board.findOne({
      _id: boardId,
      user: req.user._id,
    });

    if (!board)
      return res
        .status(403)
        .json({ message: "Only owners can change roles" });

    const memberIndex = board.members.findIndex(
      (m) => m.user?.toString() === userId
    );

    if (memberIndex === -1)
      return res.status(404).json({ message: "Member not found" });

    board.members[memberIndex].role = role;
    await board.save();

    const updatedBoard = await Board.findById(boardId).populate(
      "members.user",
      "username email"
    );

    res.json(updatedBoard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeMember = async (req, res) => {
  try {
    const { boardId, userId } = req.params;

    const board = await Board.findOne({
      _id: boardId,
      user: req.user._id,
    });

    if (!board)
      return res
        .status(403)
        .json({ message: "Only owners can remove members" });

    if (userId === board.user.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot remove the board owner" });
    }

    board.members = board.members.filter(
      (m) => m.user?.toString() !== userId
    );

    await board.save();

    const updatedBoard = await Board.findById(boardId).populate(
      "members.user",
      "username email"
    );

    res.json(updatedBoard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBoards,
  getBoardData,
  createBoard,
  deleteBoard,
  updateBoard,
  updateMemberRole,
  removeMember,
};