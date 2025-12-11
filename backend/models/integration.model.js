// backend/models/integration.model.js
import { DataTypes } from "sequelize";
import { sequelize } from "../lib/db.js";

const Integration = sequelize.define(
  "Integration",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    provider: { type: DataTypes.STRING }, // google, meta, linkedin
    config: { type: DataTypes.JSONB }, // tokens, settings
    connected: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "integrations", timestamps: true }
);

export default Integration;
