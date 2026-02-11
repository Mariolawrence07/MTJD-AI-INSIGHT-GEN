import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const getAccessToken = (req) => {
  const cookieToken = req.cookies?.accessToken;
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization || req.headers.Authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  return null;
};

export const protectRoute = async (req, res, next) => {
  try {
    const token = getAccessToken(req);
    if (!token) return res.status(401).json({ message: "Unauthorized - No access token provided" });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    return next();
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized - Invalid access token" });
  }
};

export const adminRoute = (req, res, next) => {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ message: "Access denied - Admin only" });
};