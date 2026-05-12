const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  getShipperPosts,
  getClientPosts,
  getShipperPostById,
  getClientPostById,
  createShipperPost,
  createClientPost,
  updateShipperPost,
  updateClientPost,
  deleteShipperPost,
  deleteClientPost,
  getMyPosts,
  getClientPostMatches,
  getShipperPostMatches,
} = require("../controllers/postController");

router.get("/shipper", getShipperPosts);
router.get("/client", getClientPosts);
router.get("/shipper/:id", getShipperPostById);
router.get("/client/:id", getClientPostById);
router.get("/client/:id/matches", getClientPostMatches);
router.get("/shipper/:id/matches", getShipperPostMatches);

router.get("/mine", authMiddleware, getMyPosts);

router.post("/shipper", authMiddleware, createShipperPost);
router.post("/client", authMiddleware, createClientPost);

router.put("/shipper/:id", authMiddleware, updateShipperPost);
router.put("/client/:id", authMiddleware, updateClientPost);

router.delete("/shipper/:id", authMiddleware, deleteShipperPost);
router.delete("/client/:id", authMiddleware, deleteClientPost);

module.exports = router;
