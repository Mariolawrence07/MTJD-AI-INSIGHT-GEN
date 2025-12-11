// backend/routes/survey.routes.js
import express from "express";
import { createSurvey, submitResponse } from "../controllers/survey.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();
router.post("/", protectRoute, createSurvey);
router.post("/:id/responses", protectRoute, submitResponse);
export default router;
