const express = require("express");
const { 
  createTask, 
  updateTask, 
  deleteTask 
} = require("../controllers/task.controller");
const { protect } = require("../middleware/auth.middleware");
const router = express.Router();

router.use(protect); // All task routes are protected

router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

module.exports = router;
