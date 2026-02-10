import express from "express";
import cors from "cors";
import { connectDB, sequelize } from "./lib/db.js";
import { errorHandler } from "./middleware/error.middleware.js";

import authRoutes from "./routes/auth.route.js";
import personaRoutes from "./routes/persona.routes.js";
import surveyRoutes from "./routes/survey.routes.js";
import campaignRoutes from "./routes/campaign.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import integrationRoutes from "./routes/integration.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import aiRoutes from "./routes/ai.routes.js";

dotenv.config();

const PORT = process.env.PORT;

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: "http://localhost:5173", // Allow your frontend's URL
  credentials: true, // Allow cookies and other credentials
}));

app.use("/api/auth", authRoutes);
app.use("/api/personas", personaRoutes);
app.use("/api/surveys", surveyRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/integrations", integrationRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);

app.use(errorHandler);

connectDB();

(async () => {
  try {
    await sequelize.sync({ alter: true }); // auto-create/update table
    console.log("✅ Database synced successfully");
  } catch (err) {
    console.error("❌ Error syncing database:", err);
  }
})();

app.listen(PORT, () => console.log("Server running on port " + PORT));
