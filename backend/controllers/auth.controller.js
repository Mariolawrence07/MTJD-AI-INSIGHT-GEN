import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../lib/email.js";

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60); // 7 days
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const RESET_TOKEN_TTL_SECONDS = 15 * 60;

// ✅ SIGNUP
export const signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, password });

    const { accessToken, refreshToken } = generateTokens(user.id);
    await storeRefreshToken(user.id, refreshToken);
    setCookies(res, accessToken, refreshToken);

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Error in signup controller:", error.message);
    res.status(500).json({ message: error.message });
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

    const { accessToken, refreshToken } = generateTokens(user.id);
    await storeRefreshToken(user.id, refreshToken);
    setCookies(res, accessToken, refreshToken);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Error in login controller:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ LOGOUT
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      await redis.del(`refresh_token:${decoded.userId}`);
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout controller:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};


// ✅ REFRESH TOKEN
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token provided" });

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

    if (storedToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.json({ message: "Token refreshed successfully" });
  } catch (error) {
    console.error("Error in refreshToken controller:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ PROFILE
export const getProfile = async (req, res) => {
  try {
    // const user = await User.findByPk(req.user.userId, {
    //   attributes: ["id", "name", "email", "role", "company", "industry", "subscriptionPlan"],
    // });
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Always respond the same message to avoid email enumeration
    const genericMsg =
      "If an account exists for that email, you’ll receive a password reset link shortly.";

    if (!email) return res.status(200).json({ message: genericMsg });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(200).json({ message: genericMsg });

    // Create raw token to email
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Hash token before storing (so if redis leaks, raw token isn't usable)
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // Store mapping tokenHash -> userId in redis with expiry
    await redis.set(`reset_token:${tokenHash}`, String(user.id), "EX", RESET_TOKEN_TTL_SECONDS);

    // Optional: invalidate old reset tokens for this user by tracking latest token
    // (helps prevent multiple valid tokens)
    await redis.set(`reset_token_latest:${user.id}`, tokenHash, "EX", RESET_TOKEN_TTL_SECONDS);

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail({
      to: user.email,
      resetUrl,
    });

    return res.status(200).json({ message: genericMsg });
  } catch (error) {
    console.error("Error in forgotPassword controller:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and newPassword are required" });
    }

    // Hash incoming token to match stored key
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const userId = await redis.get(`reset_token:${tokenHash}`);
    if (!userId) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Optional check: ensure it's the latest token issued for that user
    const latestHash = await redis.get(`reset_token_latest:${userId}`);
    if (latestHash && latestHash !== tokenHash) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    // Update password (assumes your User model hashes on save via hook)
    user.password = newPassword;
    await user.save();

    // Delete reset token(s)
    await redis.del(`reset_token:${tokenHash}`);
    await redis.del(`reset_token_latest:${userId}`);

    // Security: invalidate sessions (force re-login)
    await redis.del(`refresh_token:${userId}`);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.json({ message: "Password reset successful. Please log in again." });
  } catch (error) {
    console.error("Error in resetPassword controller:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};
