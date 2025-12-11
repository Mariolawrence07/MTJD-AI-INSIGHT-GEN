import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

export const sequelize = new Sequelize(process.env.POSTGRES_URI, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // important for Neon connections
    },
  },
  logging: false, // disable console SQL logs
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to Neon PostgreSQL database");
  } catch (error) {
    console.error("❌ Error connecting to PostgreSQL database:", error);
    process.exit(1);
  }
};
