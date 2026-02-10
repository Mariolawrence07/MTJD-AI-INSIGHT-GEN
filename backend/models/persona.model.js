// backend/models/persona.model.js
import { DataTypes } from "sequelize";
import { sequelize } from "../lib/db.js";

const Persona = sequelize.define(
  "Persona",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: true },
    name: { type: DataTypes.STRING },
    summary: { type: DataTypes.TEXT },
    data: { type: DataTypes.JSONB }, // raw AI JSON
    extracted_insights:{type: DataTypes.JSONB},
    emotional_profile: { type: DataTypes.JSONB },
    messaging_pillars:{ type: DataTypes.JSONB },
    accessibility_profile:{ type: DataTypes.JSONB },
    engagement_strategy :{ type: DataTypes.JSONB }
    
  },
  { tableName: "personas", timestamps: true }
);

export default Persona;
