const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");
const adminController = require("../controllers/adminController");

router.use(authMiddleware);
router.use(requireAdmin);

router.get("/stats", adminController.getStats);
router.get("/users", adminController.getUsers);
router.delete("/users/:id", adminController.deleteUser);

module.exports = router;
