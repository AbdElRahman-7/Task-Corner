const User = require("../models/user.model");
const Board = require("../models/board.model");
const Invite = require("../models/invite.model");
const generateToken = require("../utils/generateToken");

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const userExists = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username }] 
    });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password,
    });

    if (user) {
      // Check for pending invites for this email
      const invites = await Invite.find({ email: user.email, status: "pending" });

      for (const invite of invites) {
        const board = await Board.findById(invite.boardId);
        if (board) {
          // Add user to board members if not already there
          if (!Array.isArray(board.members)) board.members = [];
          if (!board.members.some(m => m.user?.toString() === user._id.toString())) {
            board.members.push({ user: user._id, role: "viewer" });
            await board.save();
          }
        }
        invite.status = "accepted";
        await invite.save();
      }

      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && (await user.comparePassword(password))) {
      // Auto-join boards if they had pending invites
      const invites = await Invite.find({ email: user.email, status: "pending" });

      for (const invite of invites) {
        const board = await Board.findById(invite.boardId);
        if (board) {
          if (!Array.isArray(board.members)) board.members = [];
          if (!board.members.some(m => m.user?.toString() === user._id.toString())) {
            board.members.push({ user: user._id, role: "viewer" });
            await board.save();
          }
        }
        invite.status = "accepted";
        await invite.save();
      }

      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser };
