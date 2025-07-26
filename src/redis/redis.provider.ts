import { createClient } from "redis";

export const redisClient = createClient({
  url: "redis://localhost:6379",
});

redisClient.connect().then(() => {
  console.log("✅ Redis connected successfully");
}).catch((err) => {
  console.error("❌ Redis connection failed:", err);
});

redisClient.on("error", (err) => console.error("Redis error:", err));
redisClient.on("connect", () => console.log("Redis connection event"));
redisClient.on("ready", () => console.log("✅ Redis ready event"));
