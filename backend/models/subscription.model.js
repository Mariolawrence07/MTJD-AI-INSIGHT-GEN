// backend/models/subscription.model.js
import { DataTypes } from "sequelize";
import { sequelize } from "../lib/db.js";

const Subscription = sequelize.define(
  "Subscription",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    planId: { type: DataTypes.UUID },
    status: { type: DataTypes.STRING, defaultValue: "active" },
    startAt: { type: DataTypes.DATE },
    endAt: { type: DataTypes.DATE },
  },
  { tableName: "subscriptions", timestamps: true }
);

export default Subscription;
