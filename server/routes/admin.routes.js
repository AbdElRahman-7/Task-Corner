const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const User = require("../models/user.model");
const Board = require("../models/board.model");
const Task = require("../models/task.model");
const List = require("../models/list.model");
const Invite = require("../models/invite.model");
const { protect: authMiddleware, admin: adminMiddleware } = require("../middleware/auth.middleware");

// ─────────────────────────────────────────────────────────
// GET /api/admin/users
// ─────────────────────────────────────────────────────────
router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, "-password");

    // Optimized: Fetch all boards and tasks in single queries to avoid N+1 problem
    const allBoards = await Board.find({});
    const allLists = await List.find({});
    const allTasks = await Task.find({});

    const usersWithStats = users.map((user) => {
      const userBoards = allBoards.filter(b => 
        b.user?.toString() === user._id.toString() || 
        b.members?.some(m => m.user?.toString() === user._id.toString())
      );
      
      const boardIds = userBoards.map(b => b._id.toString());
      const userLists = allLists.filter(l => boardIds.includes(l.boardId?.toString()));
      const listIds = userLists.map(l => l._id.toString());
      const userTasks = allTasks.filter(t => listIds.includes(t.listId?.toString()));

      const taskStats = {
        total: userTasks.length,
        todo: userTasks.filter((t) => t.status === "todo").length,
        inProgress: userTasks.filter((t) => t.status === "in-progress" || t.status === "in progress").length,
        done: userTasks.filter((t) => t.status === "done").length,
      };

      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role || "user",
        status: user.status || "active",
        createdAt: user.createdAt,
        boardsCount: userBoards.length,
        taskStats,
      };
    });

    res.json({ success: true, users: usersWithStats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/admin/users (Direct Create)
// ─────────────────────────────────────────────────────────
router.post("/users", authMiddleware, adminMiddleware, async (req, res) => {
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
router.post("/invite", authMiddleware, adminMiddleware, async (req, res) => {
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
router.delete("/users/bulk", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "No ids provided" });
    }

    // 1. Remove users from all board members arrays
    await Board.updateMany(
      {},
      { $pull: { members: { user: { $in: ids } } } }
    );

    // 2. Remove users from task assignments
    await Task.updateMany(
      {},
      { $pull: { assignments: { user: { $in: ids } } } }
    );

    // 3. Delete users
    await User.deleteMany({ _id: { $in: ids } });

    res.json({ success: true, message: `${ids.length} users deleted and cleaned up from boards/tasks` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;

    // 1. Remove from all board members
    await Board.updateMany(
      {},
      { $pull: { members: { user: userId } } }
    );

    // 2. Remove from task assignments
    await Task.updateMany(
      {},
      { $pull: { assignments: { user: userId } } }
    );

    // 3. Delete user
    await User.findByIdAndDelete(userId);

    res.json({ success: true, message: "User deleted and cleaned up from boards/tasks" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// PUT /api/admin/users/:id
// ─────────────────────────────────────────────────────────
router.put("/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
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
router.get("/users/:id/boards", authMiddleware, adminMiddleware, async (req, res) => {
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
router.put("/users/:id/boards/:boardId/role", authMiddleware, adminMiddleware, async (req, res) => {
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