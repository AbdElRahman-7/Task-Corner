const express = require("express");
const { 
  createList, 
  updateList, 
  deleteList 
} = require("../controllers/list.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

router.post("/", createList);
router.put("/:id", updateList);
router.delete("/:id", deleteList);

module.exports = router;
