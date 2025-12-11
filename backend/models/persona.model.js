// backend/models/persona.model.js
import { DataTypes } from "sequelize";
import { sequelize } from "../lib/db.js";

const Persona = sequelize.define(
  "Persona",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING },
    summary: { type: DataTypes.TEXT },
    data: { type: DataTypes.JSONB }, // raw AI JSON
    emotional_profile: { type: DataTypes.JSONB },
  },
  { tableName: "personas", timestamps: true }
);

export default Persona;
