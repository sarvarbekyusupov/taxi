import { redisClient } from "../redis/redis.provider";

export async function safeGet(key: string): Promise<string | null> {
  try {
    return await redisClient.get(key);
  } catch (err) {
    console.error(`❌ Redis GET failed for key "${key}":`, err);
    return null;
  }
}

export async function safeSet(
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<void> {
  try {
    if (ttlSeconds) {
      await redisClient.set(key, value, { EX: ttlSeconds });
    } else {
      await redisClient.set(key, value);
    }
  } catch (err) {
    console.error(`❌ Redis SET failed for key "${key}":`, err);
  }
}

export async function safeDel(key: string): Promise<void> {
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error(`❌ Redis DEL failed for key "${key}":`, err);
  }
}
