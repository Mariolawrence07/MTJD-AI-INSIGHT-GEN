// backend/routes/integration.routes.js
import express from "express";
import { connectIntegration, listIntegrations } from "../controllers/integration.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();
router.post("/connect", protectRoute, connectIntegration);
router.get("/", protectRoute, listIntegrations);
export default router;
