const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Invite = require("../models/invite.model");
const Board = require("../models/board.model");
const Workspace = require("../models/workspace.model");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

// @desc    Create an invite link
// @route   POST /api/invite
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const { email, boardId, workspaceId, taskId, role } = req.body;
    console.log("Incoming Invite:", { email, boardId, workspaceId, taskId });

    const bId = (boardId && boardId !== "undefined" && boardId !== "null") ? boardId : null;
    const wId = (workspaceId && workspaceId !== "undefined" && workspaceId !== "null") ? workspaceId : null;
    const tId = (taskId && taskId !== "undefined" && taskId !== "null") ? taskId : null;
    console.log("Sanitized IDs:", { bId, wId, tId });

    if (!email || (!bId && !wId)) {
      return res.status(400).json({ message: "Email and either Board ID or Workspace ID are required" });
    }

    if (bId && !mongoose.Types.ObjectId.isValid(bId)) {
      return res.status(400).json({ message: "Invalid Board ID" });
    }

    if (wId && !mongoose.Types.ObjectId.isValid(wId)) {
      return res.status(400).json({ message: "Invalid Workspace ID" });
    }

    if (tId && !mongoose.Types.ObjectId.isValid(tId)) {
      return res.status(400).json({ message: "Invalid Task ID" });
    }

    // Check if an invite already exists for this email and target
    const query = { email, status: "pending" };
    if (bId) query.boardId = bId;
    if (wId) query.workspaceId = wId;
    if (tId) query.taskId = tId;

    const existingInvite = await Invite.findOne(query);
    if (existingInvite) {
      return res.json({ 
        message: "Invite already sent", 
        link: `${process.env.CLIENT_URL}/invite/${existingInvite.token}` 
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const invite = await Invite.create({
      email,
      boardId: bId || undefined,  
      workspaceId: wId || undefined,
      taskId: tId || undefined,
      token,
      role: role || "viewer",
    });

    const link = `${process.env.CLIENT_URL}/invite/${token}`;

    console.log(`Invite created for ${email}: ${link}`);

    res.status(201).json({ 
      message: "Invite link generated successfully", 
      link 
    });
  } catch (error) {
    console.error("Invite Error:", error);
    res.status(500).json({ message: error.message || "Server error creating invite" });
  }
});

// @desc    Get invite details by token
// @route   GET /api/invite/:token
// @access  Public
router.get("/:token", async (req, res) => {
  try {
    const invite = await Invite.findOne({ token: req.params.token });
    if (!invite) {
      return res.status(404).json({ message: "Invalid invite" });
    };

    res.json(invite);
  } catch (error) {
    console.error("Invite Lookup Error:", error);
    res.status(500).json({ message: "Server error finding invite" });
  }
});

// @desc    Accept an invite
// @route   POST /api/invite/:token/accept
// @access  Private
router.post("/:token/accept", protect, async (req, res) => {
  try {
    const invite = await Invite.findOne({ token: req.params.token, status: "pending" });
    if (!invite) {
      return res.status(404).json({ message: "Invalid or expired invite" });
    }

    const user = await mongoose.model('User').findById(req.user._id);

    // Verify the logged-in user's email matches the invite email
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json({ message: "This invite was sent to a different email address." });
    }

    let responseMessage = "Successfully joined";
    let redirectId = "";

    // Handle Workspace Invite
    if (invite.workspaceId) {
      const Workspace = mongoose.model('Workspace');
      const workspace = await Workspace.findById(invite.workspaceId);
      if (!workspace) {
        return res.status(404).json({ message: "Workspace no longer exists" });
      }
      if (!workspace.members.some(m => m.user?.toString() === user._id.toString())) {
        workspace.members.push({ user: user._id, role: invite.role || "viewer" });
        await workspace.save();
      }
      responseMessage = "Successfully joined the workspace";
      redirectId = workspace._id;
    }

    // Handle Board Invite
    if (invite.boardId) {
      const Board = mongoose.model('Board');
      const board = await Board.findById(invite.boardId);
      if (!board) {
        return res.status(404).json({ message: "Board no longer exists" });
      }
      if (!board.members.some(m => m.user?.toString() === user._id.toString())) {
        board.members.push({ user: user._id, role: invite.role || "viewer" });
        await board.save();
      }
      responseMessage = "Successfully joined the board";
      redirectId = board._id;

      // Handle Task Assignment if taskId is present
      if (invite.taskId) {
        const Task = mongoose.model('Task');
        const task = await Task.findById(invite.taskId);
        if (task) {
          const isAlreadyAssigned = task.assignments.some(a => a.user?.toString() === user._id.toString());
          if (!isAlreadyAssigned) {
            const taskRole = invite.role === "editor" ? "editor" : "viewer";
            const perms = invite.role === "editor" ? { allActions: true } : {};
            task.assignments.push({ user: user._id, role: taskRole, permissions: perms });
            await task.save();
          }
          responseMessage = `Successfully joined the board and assigned to task: ${task.title}`;
        }
      }
    }

    invite.status = "accepted";
    await invite.save();

    res.json({ message: responseMessage, id: redirectId, type: invite.workspaceId ? 'workspace' : 'board' });
  } catch (error) {
    console.error("Invite Accept Error:", error);
    res.status(500).json({ message: error.message || "Server error accepting invite" });
  }
});

// @desc    Cancel an invite
// @route   DELETE /api/invite/:inviteId
// @access  Private
router.delete("/:inviteId", protect, async (req, res) => {
  try {
    const invite = await Invite.findById(req.params.inviteId);
    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }

    // Permission check: only board/workspace owner can cancel invites
    if (invite.boardId) {
      const board = await Board.findById(invite.boardId);
      if (!board || board.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to cancel this invite" });
      }
    } else if (invite.workspaceId) {
       const workspace = await Workspace.findById(invite.workspaceId);
       if (!workspace || workspace.user.toString() !== req.user._id.toString()) {
         return res.status(403).json({ message: "Not authorized to cancel this invite" });
       }
    }

    await Invite.findByIdAndDelete(req.params.inviteId);
    res.json({ message: "Invite cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
