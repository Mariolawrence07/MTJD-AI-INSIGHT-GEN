// backend/models/analytics.model.js
import { DataTypes } from "sequelize";
import { sequelize } from "../lib/db.js";

const Analytics = sequelize.define(
  "Analytics",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    campaignId: { type: DataTypes.UUID },
    date: { type: DataTypes.DATEONLY },
    impressions: { type: DataTypes.INTEGER },
    clicks: { type: DataTypes.INTEGER },
    conversions: { type: DataTypes.INTEGER },
    revenue: { type: DataTypes.FLOAT },
    meta: { type: DataTypes.JSONB },
  },
  { tableName: "analytics", timestamps: true }
);

export default Analytics;
