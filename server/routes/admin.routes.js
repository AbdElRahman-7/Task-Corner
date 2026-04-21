const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const User = require("../models/user.model");
const Board = require("../models/board.model");
const Task = require("../models/task.model");
const List = require("../models/list.model");
const Invite = require("../models/invite.model");
const { protect: authMiddleware } = require("../middleware/auth.middleware");

// ─────────────────────────────────────────────────────────
// GET /api/admin/users
// ─────────────────────────────────────────────────────────
router.get("/users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, "-password");

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const allBoards = await Board.find({
          $or: [{ user: user._id }, { "members.user": user._id }],
        });
        const boardIds = allBoards.map((b) => b._id);

        const lists = await List.find({ boardId: { $in: boardIds } });
        const listIds = lists.map((l) => l._id);

        const tasks = await Task.find({ listId: { $in: listIds } });

        const taskStats = {
          total: tasks.length,
          todo: tasks.filter((t) => t.status === "todo").length,
          inProgress: tasks.filter((t) => t.status === "in-progress").length,
          done: tasks.filter((t) => t.status === "done").length,
        };

        return {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role || "user",
          status: user.status || "active",
          createdAt: user.createdAt,
          boardsCount: allBoards.length,
          taskStats,
        };
      })
    );

    res.json({ success: true, users: usersWithStats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/admin/users (Direct Create)
// ─────────────────────────────────────────────────────────
router.post("/users", authMiddleware, async (req, res) => {
  try {
    const { username, email, password, boardId, role, status } = req.body;
    
    if (!username || !email) {
      return res.status(400).json({ success: false, message: "Username and email are required" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ success: false, message: "Email already taken" });

    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ success: false, message: "Username already taken" });

    const user = await User.create({
      username,
      email,
      password: password || "123456", // Default password
      role: role === "admin" ? "admin" : "user",
      status: status === "disabled" ? "disabled" : "active",
    });

    if (boardId) {
      const board = await Board.findById(boardId);
      if (board) {
        if (!board.members.some(m => m.user?.toString() === user._id.toString())) {
          board.members.push({ user: user._id, role: role || "viewer" });
          await board.save();
        }
      }
    }

    res.status(201).json({ 
      success: true, 
      user: { _id: user._id, username: user.username, email: user.email },
      message: "User created successfully" 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/admin/invite
// Send an invite link to a new user by email
// ─────────────────────────────────────────────────────────
router.post("/invite", authMiddleware, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User with this email already exists" });
    }

    // Check if invite already sent
    const existingInvite = await Invite.findOne({ email, status: "pending" });
    if (existingInvite) {
      return res.json({
        success: true,
        link: `${process.env.CLIENT_URL}/invite/${existingInvite.token}`,
        message: "Invite already sent",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    await Invite.create({ email, token });

    const link = `${process.env.CLIENT_URL}/invite/${token}`;
    res.status(201).json({ success: true, link, message: "Invite sent successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// DELETE /api/admin/users/bulk  ← must be before /:id
// ─────────────────────────────────────────────────────────
router.delete("/users/bulk", authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "No ids provided" });
    }
    await User.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${ids.length} users deleted` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// DELETE /api/admin/users/:id
// ─────────────────────────────────────────────────────────
router.delete("/users/:id", authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// PUT /api/admin/users/:id
// ─────────────────────────────────────────────────────────
router.put("/users/:id", authMiddleware, async (req, res) => {
  try {
    const { username, email } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { username, email },
      { new: true, select: "-password" }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/admin/users/:id/boards
// ─────────────────────────────────────────────────────────
router.get("/users/:id/boards", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    // Find boards where user is owner or member
    const boards = await Board.find({
      $or: [{ user: userId }, { "members.user": userId }],
    });

    const boardRoles = boards.map((b) => {
      const isOwner = b.user.toString() === userId;
      let role = "viewer";
      if (isOwner) {
        role = "editor";
      } else {
        const member = b.members.find(m => m.user?.toString() === userId);
        role = member ? member.role : "viewer";
      }
      return {
        boardId: b._id,
        boardName: b.title,
        role: role,
      };
    });

    res.json({ success: true, boardRoles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// PUT /api/admin/users/:id/boards/:boardId/role
router.put("/users/:id/boards/:boardId/role", authMiddleware, async (req, res) => {
  try {
    const { id: userId, boardId } = req.params;
    const { role } = req.body;

    if (!["viewer", "editor"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const board = await Board.findOne({ _id: boardId });
    if (!board) return res.status(404).json({ success: false, message: "Board not found" });

    const memberIndex = board.members.findIndex(m => m.user?.toString() === userId);
    if (memberIndex === -1) {
      return res.status(404).json({ success: false, message: "User is not a member of this board" });
    }

    board.members[memberIndex].role = role;
    await board.save();

    res.json({ success: true, message: "Role updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;