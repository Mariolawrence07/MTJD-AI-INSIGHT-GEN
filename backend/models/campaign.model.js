// backend/models/campaign.model.js
import { DataTypes } from "sequelize";
import { sequelize } from "../lib/db.js";

const Campaign = sequelize.define(
  "Campaign",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING },
    objective: { type: DataTypes.STRING },
    targetAudience: { type: DataTypes.JSONB },
    platforms: { type: DataTypes.ARRAY(DataTypes.STRING) },
    budget: { type: DataTypes.FLOAT },
    startDate: { type: DataTypes.DATE },
    endDate: { type: DataTypes.DATE },
    status: { type: DataTypes.ENUM("draft", "running", "paused", "completed"), defaultValue: "draft" },
    performance: { type: DataTypes.JSONB },
  },
  { tableName: "campaigns", timestamps: true }
);

export default Campaign;
