import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// Create Redis client
// Make sure REDIS_URL is in your .env file
// Example: REDIS_URL=rediss://default:YOUR_PASSWORD@oriented-robin-13943.upstash.io:6379
export const redis = new Redis(process.env.REDIS_URL, {
  // Optional: configure TLS settings if needed
  tls: {
    rejectUnauthorized: false, // Upstash SSL
  },
});

// Test connection
// (async () => {
//   try {
//     await redis.set("test_key", "hello");
//     const value = await redis.get("test_key");
//     console.log("Redis connected! Test value:", value); // Should print "hello"
//   } catch (err) {
//     console.error("Redis connection failed:", err);
//   }
// })();
