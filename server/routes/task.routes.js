const express = require("express");
const { 
  createTask, 
  updateTask, 
  deleteTask,
  moveTask
} = require("../controllers/task.controller");
const { protect } = require("../middleware/auth.middleware");
const router = express.Router();

router.use(protect); // All task routes are protected

router.post("/", createTask);
router.put("/:id", updateTask);
router.put("/:id/move", moveTask);
router.delete("/:id", deleteTask);

module.exports = router;
