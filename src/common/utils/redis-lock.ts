// src/utils/redis-lock.ts
import { Counter, Histogram } from "prom-client";
import { redisClient } from "../../redis/redis.provider";

export const redisOperationDuration = new Histogram({
  name: "redis_operation_duration_seconds",
  help: "Duration of Redis operations in seconds",
  labelNames: ["operation"],
});
export const redisOperationCounter = new Counter({
  name: "redis_operations_total",
  help: "Total number of Redis operations",
  labelNames: ["operation", "status"],
});

export async function acquireLock(
  key: string,
  ttl: number,
  correlationId: string
): Promise<boolean> {
  const timer = redisOperationDuration.startTimer({
    operation: "acquire_lock",
  });
  try {
    const result = await redisClient.set(key, correlationId, {
      NX: true,
      PX: ttl,
    });
    return result === "OK";
  } finally {
    timer();
  }
}

export async function releaseLock(
  key: string,
  correlationId: string
): Promise<boolean> {
  const timer = redisOperationDuration.startTimer({
    operation: "release_lock",
  });
  try {
    const lua = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      else
        return 0
      end
    `;
    const result = (await redisClient.eval(lua, {
      keys: [key],
      arguments: [correlationId],
    })) as number;

    const status = result === 1 ? "success" : "failure";
    redisOperationCounter.inc({ operation: "release_lock", status });
    return result === 1;
  } catch (err) {
    redisOperationCounter.inc({ operation: "release_lock", status: "error" });
    throw err;
  } finally {
    timer();
  }
}
