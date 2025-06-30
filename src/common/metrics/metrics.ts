// src/common/metrics.ts
import { register, Histogram, Counter } from "prom-client";

register.clear();


export const rideCreationDuration = new Histogram({
  name: "ride_creation_duration_seconds",
  help: "Duration of ride creation operations",
  buckets: [0.1, 0.5, 1, 2, 5],
});

export const driverMatchingDuration = new Histogram({
  name: "driver_matching_duration_seconds",
  help: "Duration of driver matching operations",
  buckets: [0.1, 0.5, 1, 2, 5],
});

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

export const rideCreationCounter = new Counter({
  name: "ride_creation_total",
  help: "Total number of ride creation attempts",
  labelNames: ["status", "tariff_type"],
});

// Barchasini ro‘yxatga olish
register.registerMetric(rideCreationDuration);
register.registerMetric(driverMatchingDuration);
register.registerMetric(redisOperationDuration);
register.registerMetric(redisOperationCounter);
register.registerMetric(rideCreationCounter);
