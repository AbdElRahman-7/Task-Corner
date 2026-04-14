const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Invite = require("../models/invite.model");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

// @desc    Create an invite link
// @route   POST /api/invite
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const { email, boardId } = req.body;

    if (!email || !boardId) {
      return res.status(400).json({ message: "Email and Board ID are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return res.status(400).json({ message: "Invalid Board ID" });
    }

    // Check if an invite already exists for this email and board
    const existingInvite = await Invite.findOne({ email, boardId, status: "pending" });
    if (existingInvite) {
      return res.json({ 
        message: "Invite already sent", 
        link: `http://localhost:3000/invite/${existingInvite.token}` 
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const invite = await Invite.create({
      email,
      boardId,
      token,
    });

    const link = `http://localhost:3000/invite/${token}`;

    console.log(`Invite created for ${email}: ${link}`);

    res.status(201).json({ 
      message: "Invite sent successfully", 
      link 
    });
  } catch (error) {
    console.error("Invite Error:", error);
    res.status(500).json({ message: "Server error creating invite" });
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

    const board = await mongoose.model('Board').findById(invite.boardId);
    if (!board) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (!Array.isArray(board.members)) board.members = [];
    if (!board.members.includes(user._id)) {
      board.members.push(user._id);
      await board.save();
    }

    invite.status = "accepted";
    await invite.save();

    res.json({ message: "Successfully joined the workspace", boardId: board._id });
  } catch (error) {
    console.error("Invite Accept Error:", error);
    res.status(500).json({ message: "Server error accepting invite" });
  }
});

module.exports = router;
