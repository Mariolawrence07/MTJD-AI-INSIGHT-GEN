// backend/routes/campaign.routes.js
import express from "express";
import { createCampaign, listCampaigns, createCreative } from "../controllers/campaign.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();
router.post("/", protectRoute, createCampaign);
router.get("/", protectRoute, listCampaigns);
router.post("/creative", protectRoute, createCreative);
export default router;
