import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const getAccessToken = (req) => {
  // 1) cookie
  const cookieToken = req.cookies?.accessToken;
  if (cookieToken) return cookieToken;

  // 2) Authorization header fallback
  const header = req.headers.authorization || req.headers.Authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }

  return null;
};

export const protectRoute = async (req, res, next) => {
  try {
    const accessToken = getAccessToken(req);

    if (!accessToken) {
      return res.status(401).json({ message: "Unauthorized - No access token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      if (error?.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Unauthorized - Access token expired" });
      }
      return res.status(401).json({ message: "Unauthorized - Invalid access token" });
    }

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    return next();
  } catch (error) {
    console.error("Error in protectRoute middleware:", error.message);
    return res.status(401).json({ message: "Unauthorized - Invalid access token" });
  }
};

export const adminRoute = (req, res, next) => {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ message: "Access denied - Admin only" });
};