import crypto from "crypto";
import jwt from "jsonwebtoken";
import { redis } from "../lib/redis.js";
import { sendPasswordResetEmail } from "../lib/email.js";
import User from "../models/user.model.js";

const ACCESS_TTL = "15m";
const REFRESH_TTL = "7d";
const RESET_TOKEN_TTL_SECONDS = 15 * 60;

const REFRESH_KEY = (userId) => `refresh_token:${userId}`;
const RESET_KEY = (hash) => `reset_token:${hash}`;
const RESET_LATEST_KEY = (userId) => `reset_token_latest:${userId}`;

const signAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TTL });

const signRefreshToken = (userId) =>
  jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TTL });

const cookieBase = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
};

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  if (accessToken) {
    res.cookie("accessToken", accessToken, { ...cookieBase, maxAge: 15 * 60 * 1000 });
  }
  if (refreshToken) {
    res.cookie("refreshToken", refreshToken, { ...cookieBase, maxAge: 7 * 24 * 60 * 60 * 1000 });
  }
};

const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", cookieBase);
  res.clearCookie("refreshToken", cookieBase);
};

const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(REFRESH_KEY(userId), refreshToken, "EX", 7 * 24 * 60 * 60);
};

const issueSession = async (res, userId) => {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);
  await storeRefreshToken(userId, refreshToken);
  setAuthCookies(res, { accessToken, refreshToken });
  return { accessToken, refreshToken };
};

const pickRefreshToken = (req) => {
  // cookie first, then body
  return req.cookies?.refreshToken || req.body?.refreshToken || null;
};

// ✅ SIGNUP
export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ name, email, password });
    const { accessToken, refreshToken } = await issueSession(res, user.id);

    // ✅ return tokens for Bearer auth fallback
    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken,
      refreshToken,
    });
  } catch (e) {
    console.error("signup error:", e.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ✅ LOGIN
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const { accessToken, refreshToken } = await issueSession(res, user.id);

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken,
      refreshToken,
    });
  } catch (e) {
    console.error("login error:", e.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ✅ LOGOUT
export const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || null;
    if (token) {
      const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
      await redis.del(REFRESH_KEY(decoded.userId));
    }
    clearAuthCookies(res);
    return res.json({ message: "Logged out successfully" });
  } catch (e) {
    clearAuthCookies(res);
    return res.json({ message: "Logged out" });
  }
};

// ✅ REFRESH TOKEN (cookie OR body) -> returns { accessToken }
export const refreshToken = async (req, res) => {
  try {
    const token = pickRefreshToken(req);
    if (!token) return res.status(401).json({ message: "No refresh token provided" });

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const stored = await redis.get(REFRESH_KEY(decoded.userId));

    if (!stored || stored !== token) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = signAccessToken(decoded.userId);
    setAuthCookies(res, { accessToken: newAccessToken });

    return res.json({ accessToken: newAccessToken });
  } catch (e) {
    clearAuthCookies(res);
    return res.status(401).json({ message: "Refresh failed" });
  }
};

// ✅ PROFILE (req.user is set by middleware)
export const getProfile = async (req, res) => {
  return res.json(req.user);
};

// ✅ FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const genericMsg =
      "If an account exists for that email, you’ll receive a password reset link shortly.";

    if (!email) return res.status(200).json({ message: genericMsg });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(200).json({ message: genericMsg });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    await redis.set(RESET_KEY(tokenHash), String(user.id), "EX", RESET_TOKEN_TTL_SECONDS);
    await redis.set(RESET_LATEST_KEY(user.id), tokenHash, "EX", RESET_TOKEN_TTL_SECONDS);

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail({ to: user.email, resetUrl });

    return res.status(200).json({ message: genericMsg });
  } catch (e) {
    console.error("forgotPassword error:", e.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ✅ RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and newPassword are required" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const userId = await redis.get(RESET_KEY(tokenHash));
    if (!userId) return res.status(400).json({ message: "Invalid or expired reset token" });

    const latestHash = await redis.get(RESET_LATEST_KEY(userId));
    if (latestHash && latestHash !== tokenHash) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(400).json({ message: "Invalid reset token" });

    user.password = newPassword;
    await user.save();

    await redis.del(RESET_KEY(tokenHash));
    await redis.del(RESET_LATEST_KEY(userId));
    await redis.del(REFRESH_KEY(userId));

    clearAuthCookies(res);
    return res.json({ message: "Password reset successful. Please log in again." });
  } catch (e) {
    console.error("resetPassword error:", e.message);
    return res.status(500).json({ message: "Server error" });
  }
};