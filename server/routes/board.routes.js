const express = require("express");
const { 
  getBoards, 
  getBoardData, 
  createBoard, 
  deleteBoard 
} = require("../controllers/board.controller");
const { protect } = require("../middleware/auth.middleware");
const router = express.Router();

router.use(protect); // All board routes are protected

router.get("/", getBoards);
router.get("/:boardId", getBoardData);
router.post("/", createBoard);
router.delete("/:id", deleteBoard);

module.exports = router;
