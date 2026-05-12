const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const rateLimit = require("../middleware/rateLimit");
const {
  register,
  login,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  sendEmailVerification,
  verifyEmail,
  completeProfile,
  getProfile,
  updateProfile,
} = require("../controllers/authController");

const FIVE_MINUTES = 5 * 60 * 1000;

const authLimiter = rateLimit({ windowMs: FIVE_MINUTES, max: 10 });
const otpLimiter = rateLimit({ windowMs: FIVE_MINUTES, max: 5 });

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);

router.post("/send-email-otp", otpLimiter, sendEmailVerification);
router.post("/verify-email", otpLimiter, verifyEmail);

router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/verify-otp", otpLimiter, verifyResetOtp);
router.post("/reset-password", authLimiter, resetPassword);

router.post("/complete-profile", authLimiter, completeProfile);

router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);

module.exports = router;
