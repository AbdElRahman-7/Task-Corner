const express = require("express");
const { 
  getBoards, 
  getBoardData, 
  createBoard, 
  deleteBoard,
  updateBoard,
  updateMemberRole,
  removeMember
} = require("../controllers/board.controller");
const { protect } = require("../middleware/auth.middleware");
const router = express.Router();

router.use(protect); // All board routes are protected

router.get("/", getBoards);
router.get("/:boardId", getBoardData);
router.post("/", createBoard);
router.put("/:boardId", updateBoard);
router.delete("/:boardId", deleteBoard);
router.put("/:boardId/members/:userId", updateMemberRole);
router.delete("/:boardId/members/:userId", removeMember);

module.exports = router;
