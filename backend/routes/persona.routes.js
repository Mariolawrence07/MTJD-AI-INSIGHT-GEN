// backend/routes/persona.routes.js
import express from "express";
import { createPersonaFromPayload, listPersonas, getPersona } from "../controllers/persona.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();
router.post("/", protectRoute, createPersonaFromPayload);
router.get("/", protectRoute, listPersonas);
router.get("/:id", protectRoute, getPersona);
export default router;
