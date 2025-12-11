// backend/models/survey.model.js
import { DataTypes } from "sequelize";
import { sequelize } from "../lib/db.js";

const Survey = sequelize.define(
  "Survey",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    schema: { type: DataTypes.JSONB }, // form schema/questions
    responses: { type: DataTypes.JSONB }, // aggregated responses or store separately
  },
  { tableName: "surveys", timestamps: true }
);

export default Survey;
