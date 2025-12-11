// backend/routes/analytics.routes.js
import express from "express";
import { campaignMetrics } from "../controllers/analytics.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();
router.get("/campaign/:id", protectRoute, campaignMetrics);
export default router;
