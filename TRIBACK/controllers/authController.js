const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const env = require("../config/env");
const { sendOtpEmail } = require("../services/emailService");

const BCRYPT_ROUNDS = 10;
const PASSWORD_MIN_LENGTH = 8;
const SESSION_TTL = "30d";
const ONBOARDING_TTL = "2h";
const RESET_TTL = "15m";
const OTP_TTL_MS = 10 * 60 * 1000;

function isValidEmail(value) {
  if (typeof value !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhone(value) {
  if (typeof value !== "string") return false;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
}

function isValidPassword(value) {
  return typeof value === "string" && value.length >= PASSWORD_MIN_LENGTH;
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhoneCandidates(raw) {
  const cleaned = (raw || "").replace(/\s+/g, "").trim();
  const digitsOnly = cleaned.replace(/\D/g, "");
  const candidates = new Set();
  if (cleaned) candidates.add(cleaned);
  if (digitsOnly) candidates.add(digitsOnly);
  if (digitsOnly.startsWith("213") && digitsOnly.length > 3) {
    candidates.add(digitsOnly.slice(3));
  }
  return [...candidates].filter(Boolean);
}

function trimToString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function maskEmail(email) {
  return email.replace(/(.{1,2})(.*)(@.*)/, (_match, head, _middle, tail) => `${head}***${tail}`);
}

function publicProfile(user) {
  return {
    id: user.id,
    role: user.role,
    accountType: user.account_type,
    firstName: user.first_name || "",
    lastName: user.last_name || "",
    email: user.email || "",
    phone: user.phone || "",
    dateOfBirth: user.date_of_birth || null,
    companyName: user.company_name || "",
    companyAddress: user.company_address || "",
    companyWebsite: user.company_website || "",
    profilePictureUrl: user.image || null,
    operatingCity: user.operating_city || "",
    deliveryFocus: user.delivery_focus || "",
    vehicleType: user.vehicle_type || "",
    vehicleImageUrl: user.vehicle_image || null,
    companySize: user.company_size || "",
    averageDailyOrders: user.average_daily_orders ?? null,
    notificationsEnabled: user.notifications_enabled ?? true,
    status: user.status || "available",
    emailVerified: !!user.email_verified,
    onboardingCompleted: !!user.onboarding_completed,
  };
}

function authSummary(user) {
  return {
    id: user.id,
    firstName:
      user.account_type === "enterprise"
        ? user.company_name || user.first_name
        : user.first_name,
    lastName: user.last_name || "",
    role: user.role,
    accountType: user.account_type,
    profilePictureUrl: user.image || null,
    emailVerified: !!user.email_verified,
    onboardingCompleted: !!user.onboarding_completed,
  };
}

function signToken(payload, expiresIn) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn });
}

async function issueAndSendEmailOtp(user) {
  const otpCode = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await User.storeOtp(user.id, otpCode, expiresAt, "email-verification");
  try {
    await sendOtpEmail(user.email, otpCode);
  } catch (err) {
    await User.clearOtp(user.id);
    throw err;
  }
}

async function register(req, res, next) {
  try {
    const {
      accountType,
      firstName,
      lastName,
      contactFirstName,
      contactLastName,
      companyName,
      companyAddress,
      companyWebsite,
      dateOfBirth,
      email,
      phone,
      password,
    } = req.body;

    const normalizedAccountType = (accountType || "individual").toLowerCase();
    if (!["individual", "enterprise"].includes(normalizedAccountType)) {
      return res.status(400).json({ message: "Invalid account type." });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: "Enter a valid phone number." });
    }
    if (!isValidPassword(password)) {
      return res
        .status(400)
        .json({ message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.` });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    if (normalizedAccountType === "individual") {
      if (!trimToString(firstName) || !trimToString(lastName)) {
        return res.status(400).json({ message: "First name and last name are required." });
      }
    } else {
      if (
        !trimToString(companyName) ||
        !trimToString(companyAddress) ||
        !trimToString(contactFirstName) ||
        !trimToString(contactLastName)
      ) {
        return res.status(400).json({
          message: "Company name, address, and contact name are required.",
        });
      }
    }

    const trimmedPhone = phone.trim();
    const existingPhone = await User.findByPhone(trimmedPhone);
    if (existingPhone) {
      return res.status(409).json({ message: "This phone number is already in use." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingEmail = await User.findByEmail(normalizedEmail);
    if (existingEmail) {
      return res.status(409).json({ message: "This email is already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const newUser = await User.create({
      account_type: normalizedAccountType,
      first_name:
        normalizedAccountType === "enterprise" ? contactFirstName.trim() : firstName.trim(),
      last_name:
        normalizedAccountType === "enterprise" ? contactLastName.trim() : lastName.trim(),
      company_name: normalizedAccountType === "enterprise" ? companyName.trim() : null,
      company_address: normalizedAccountType === "enterprise" ? companyAddress.trim() : null,
      company_website:
        normalizedAccountType === "enterprise" ? trimToString(companyWebsite) : null,
      date_of_birth:
        normalizedAccountType === "individual" ? dateOfBirth || null : null,
      email: normalizedEmail,
      phone: trimmedPhone,
      password: hashedPassword,
    });

    try {
      await issueAndSendEmailOtp(newUser);
    } catch (sendError) {
      const status = sendError.status || 502;
      return res.status(status).json({
        message: sendError.publicMessage || "Failed to send verification email.",
      });
    }

    return res.status(201).json({
      message: "Account created. Verify your email to continue.",
      user: authSummary(newUser),
    });
  } catch (error) {
    next(error);
  }
}

async function sendEmailVerification(req, res, next) {
  try {
    const { email } = req.body;
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findByEmail(normalizedEmail);
    if (!user) {
      return res.status(404).json({ message: "No account found for this email." });
    }
    if (user.email_verified) {
      return res.status(409).json({ message: "This email is already verified." });
    }

    try {
      await issueAndSendEmailOtp(user);
    } catch (sendError) {
      const status = sendError.status || 502;
      return res
        .status(status)
        .json({ message: sendError.publicMessage || "Failed to send verification email." });
    }

    return res.status(200).json({
      message: "Verification code sent.",
      maskedEmail: maskEmail(normalizedEmail),
    });
  } catch (error) {
    next(error);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const { email, code } = req.body;
    if (!isValidEmail(email) || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({ message: "Email and code are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findByEmail(normalizedEmail);
    if (!user || user.otp_code !== code.trim() || user.otp_purpose !== "email-verification") {
      return res.status(401).json({ message: "Invalid code." });
    }
    if (!user.otp_expires_at || new Date(user.otp_expires_at) < new Date()) {
      await User.clearOtp(user.id);
      return res
        .status(401)
        .json({ message: "This code has expired. Request a new one." });
    }

    const updatedUser = await User.markEmailVerified(user.id);

    const sessionToken = signToken(
      { userId: updatedUser.id, role: updatedUser.role, accountType: updatedUser.account_type },
      SESSION_TTL
    );

    const onboardingToken = signToken(
      {
        userId: updatedUser.id,
        accountType: updatedUser.account_type,
        purpose: "complete-profile",
      },
      ONBOARDING_TTL
    );

    return res.status(200).json({
      message: "Email verified.",
      token: sessionToken,
      onboardingToken,
      user: authSummary(updatedUser),
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { identifier, email, phone, password } = req.body;
    const loginIdentifier = (identifier || email || phone || "").trim();

    if (!loginIdentifier || typeof password !== "string" || password.length === 0) {
      return res
        .status(400)
        .json({ message: "Email or phone and password are required." });
    }

    let user = null;
    if (loginIdentifier.includes("@")) {
      user = await User.findByEmail(loginIdentifier.toLowerCase());
    } else {
      user = await User.findByPhoneCandidates(normalizePhoneCandidates(loginIdentifier));
    }

    if (!user) {
      return res.status(401).json({ message: "Email/phone or password is incorrect." });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Email/phone or password is incorrect." });
    }

    if (!user.email_verified) {
      try {
        await issueAndSendEmailOtp(user);
      } catch {
        // Non-fatal: surface the verification requirement either way.
      }
      return res.status(403).json({
        message: "Verify your email to continue.",
        code: "EMAIL_NOT_VERIFIED",
        email: user.email,
      });
    }

    const token = signToken(
      { userId: user.id, role: user.role, accountType: user.account_type },
      SESSION_TTL
    );

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: authSummary(user),
    });
  } catch (error) {
    next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findByEmail(normalizedEmail);

    const successResponse = {
      message: "If that account exists, a verification code has been sent.",
      maskedEmail: maskEmail(normalizedEmail),
    };

    if (!user) {
      return res.status(200).json(successResponse);
    }

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    await User.storeOtp(user.id, otpCode, expiresAt, "password-reset");

    try {
      await sendOtpEmail(normalizedEmail, otpCode);
    } catch (sendError) {
      await User.clearOtp(user.id);
      const status = sendError.status || 502;
      return res
        .status(status)
        .json({ message: sendError.publicMessage || "Failed to send verification email." });
    }

    return res.status(200).json(successResponse);
  } catch (error) {
    next(error);
  }
}

async function verifyResetOtp(req, res, next) {
  try {
    const { email, code } = req.body;
    if (!isValidEmail(email) || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({ message: "Email and code are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findByEmail(normalizedEmail);
    if (!user || user.otp_code !== code.trim() || user.otp_purpose !== "password-reset") {
      return res.status(401).json({ message: "Invalid code." });
    }
    if (!user.otp_expires_at || new Date(user.otp_expires_at) < new Date()) {
      await User.clearOtp(user.id);
      return res
        .status(401)
        .json({ message: "This code has expired. Request a new one." });
    }

    await User.clearOtp(user.id);

    const resetToken = signToken({ userId: user.id, purpose: "reset-password" }, RESET_TTL);

    return res.status(200).json({ message: "Code verified.", resetToken });
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !isValidPassword(password)) {
      return res.status(400).json({
        message: `Token and a password of at least ${PASSWORD_MIN_LENGTH} characters are required.`,
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.jwtSecret);
    } catch (_error) {
      return res
        .status(401)
        .json({ message: "This link has expired. Please restart the process." });
    }
    if (decoded.purpose !== "reset-password") {
      return res.status(401).json({ message: "Invalid token." });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await User.updatePassword(decoded.userId, hashedPassword);

    return res.status(200).json({ message: "Password updated." });
  } catch (error) {
    next(error);
  }
}

async function completeProfile(req, res, next) {
  try {
    const {
      token,
      profilePictureUrl,
      operatingCity,
      deliveryFocus,
      vehicleType,
      vehicleImageUrl,
      companySize,
      averageDailyOrders,
      notificationsEnabled,
    } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Onboarding token is required." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.jwtSecret);
    } catch (_error) {
      return res.status(401).json({ message: "Invalid or expired onboarding token." });
    }
    if (decoded.purpose !== "complete-profile") {
      return res.status(401).json({ message: "Invalid onboarding token." });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (!user.email_verified) {
      return res.status(403).json({ message: "Verify your email before continuing." });
    }

    if (!trimToString(operatingCity) || !trimToString(deliveryFocus)) {
      return res
        .status(400)
        .json({ message: "Operating city and delivery focus are required." });
    }
    if (user.account_type === "individual" && !trimToString(vehicleType)) {
      return res.status(400).json({ message: "Vehicle type is required." });
    }
    if (user.account_type === "enterprise" && !trimToString(companySize)) {
      return res.status(400).json({ message: "Company size is required." });
    }

    const updatedUser = await User.completeOnboarding(user.id, {
      image: trimToString(profilePictureUrl),
      operating_city: operatingCity.trim(),
      delivery_focus: deliveryFocus.trim(),
      vehicle_type: user.account_type === "individual" ? vehicleType.trim() : null,
      vehicle_image: user.account_type === "individual" ? trimToString(vehicleImageUrl) : null,
      company_size: user.account_type === "enterprise" ? companySize.trim() : null,
      average_daily_orders:
        user.account_type === "enterprise" ? Number(averageDailyOrders) || null : null,
      notifications_enabled: notificationsEnabled !== false,
    });

    const authToken = signToken(
      { userId: updatedUser.id, role: updatedUser.role, accountType: updatedUser.account_type },
      SESSION_TTL
    );

    return res.status(200).json({
      message: "Profile completed.",
      token: authToken,
      user: authSummary(updatedUser),
    });
  } catch (error) {
    next(error);
  }
}

async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ user: publicProfile(user) });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const userId = req.user?.userId;
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      companyName,
      companyAddress,
      companyWebsite,
      profilePictureUrl,
      operatingCity,
      deliveryFocus,
      vehicleType,
      vehicleImageUrl,
      companySize,
      averageDailyOrders,
      notificationsEnabled,
      status,
    } = req.body;

    if (phone !== undefined && !isValidPhone(phone)) {
      return res.status(400).json({ message: "Phone number is invalid." });
    }
    if (email !== undefined && email !== "" && email !== null && !isValidEmail(email)) {
      return res.status(400).json({ message: "Email format is invalid." });
    }

    if (phone !== undefined) {
      const trimmedPhone = phone.trim();
      if (trimmedPhone !== existingUser.phone) {
        const owner = await User.findByPhone(trimmedPhone);
        if (owner && owner.id !== existingUser.id) {
          return res.status(409).json({ message: "This phone number is already in use." });
        }
      }
    }

    if (email !== undefined) {
      const normalizedEmail = email ? email.trim().toLowerCase() : null;
      if (normalizedEmail && normalizedEmail !== existingUser.email) {
        const owner = await User.findByEmail(normalizedEmail);
        if (owner && owner.id !== existingUser.id) {
          return res.status(409).json({ message: "This email is already in use." });
        }
      }
    }

    let parsedAverageDailyOrders;
    if (averageDailyOrders !== undefined) {
      if (averageDailyOrders === null || averageDailyOrders === "") {
        parsedAverageDailyOrders = null;
      } else {
        parsedAverageDailyOrders = Number(averageDailyOrders);
        if (!Number.isFinite(parsedAverageDailyOrders) || parsedAverageDailyOrders < 0) {
          return res
            .status(400)
            .json({ message: "Average daily orders must be a positive number." });
        }
      }
    }

    const updateData = {
      first_name: firstName !== undefined ? firstName.trim() : undefined,
      last_name: lastName !== undefined ? lastName.trim() : undefined,
      email: email !== undefined ? (email ? email.trim().toLowerCase() : null) : undefined,
      phone: phone !== undefined ? phone.trim() : undefined,
      date_of_birth: dateOfBirth !== undefined ? dateOfBirth || null : undefined,
      image: profilePictureUrl !== undefined ? trimToString(profilePictureUrl) : undefined,
      operating_city: operatingCity !== undefined ? trimToString(operatingCity) : undefined,
      delivery_focus: deliveryFocus !== undefined ? trimToString(deliveryFocus) : undefined,
      notifications_enabled:
        typeof notificationsEnabled === "boolean" ? notificationsEnabled : undefined,
      status: status !== undefined ? trimToString(status) : undefined,
    };

    if (existingUser.account_type === "individual") {
      updateData.vehicle_type =
        vehicleType !== undefined ? trimToString(vehicleType) : undefined;
      updateData.vehicle_image =
        vehicleImageUrl !== undefined ? trimToString(vehicleImageUrl) : undefined;
    } else {
      updateData.company_name =
        companyName !== undefined ? trimToString(companyName) : undefined;
      updateData.company_address =
        companyAddress !== undefined ? trimToString(companyAddress) : undefined;
      updateData.company_website =
        companyWebsite !== undefined ? trimToString(companyWebsite) : undefined;
      updateData.company_size =
        companySize !== undefined ? trimToString(companySize) : undefined;
      if (parsedAverageDailyOrders !== undefined) {
        updateData.average_daily_orders = parsedAverageDailyOrders;
      }
    }

    const updatedUser = await User.updateProfile(userId, updateData);

    return res.status(200).json({
      message: "Profile updated.",
      user: publicProfile(updatedUser),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
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
};
