// backend/models/adCreative.model.js
import { DataTypes } from "sequelize";
import { sequelize } from "../lib/db.js";

const AdCreative = sequelize.define(
  "AdCreative",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    campaignId: { type: DataTypes.UUID },
    headline: { type: DataTypes.STRING },
    text: { type: DataTypes.TEXT },
    mediaUrl: { type: DataTypes.STRING },
    cta: { type: DataTypes.STRING },
    aiFeedback: { type: DataTypes.JSONB },
  },
  { tableName: "ad_creatives", timestamps: true },
);

export default AdCreative;
