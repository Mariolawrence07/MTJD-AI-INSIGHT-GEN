// backend/routes/admin.routes.js
import express from "express";
import { adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();
router.get("/health", (req, res) => res.json({ ok: true }));
// add admin-only endpoints and protect with adminRoute
export default router;
