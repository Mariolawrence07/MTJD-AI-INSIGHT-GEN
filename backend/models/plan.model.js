// backend/models/plan.model.js
import { DataTypes } from "sequelize";
import { sequelize } from "../lib/db.js";

const Plan = sequelize.define(
  "Plan",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING },
    price: { type: DataTypes.FLOAT },
    features: { type: DataTypes.JSONB },
  },
  { tableName: "plans", timestamps: true }
);

export default Plan;
