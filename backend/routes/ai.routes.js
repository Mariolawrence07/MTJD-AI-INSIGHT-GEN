// backend/routes/ai.routes.js
import express from "express";

import { refinePersona } from "../controllers/persona.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";


const router = express.Router();

// POST /api/ai/persona-refine
router.post("/persona-refine", protectRoute, refinePersona);

export default router;