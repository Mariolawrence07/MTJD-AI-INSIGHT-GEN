// backend/routes/persona.routes.js
import express from "express";
import { createPersonaFromPayload, listPersonas, getPersona, createPersonaFromUpload} from "../controllers/persona.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { uploadSingle } from "../middleware/upload.middleware.js";

const router = express.Router();
router.post("/", protectRoute, createPersonaFromPayload);
router.get("/", protectRoute, listPersonas);
router.get("/:id", protectRoute, getPersona);
router.post("/upload", protectRoute, uploadSingle, createPersonaFromUpload);

export default router;
