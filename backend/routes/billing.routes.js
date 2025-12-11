// backend/routes/billing.routes.js
import express from "express";
import { subscribe } from "../controllers/billing.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();
router.post("/subscribe", protectRoute, subscribe);
export default router;
