// src/metrics/ride.metrics.ts
import { Histogram, Counter, register } from "prom-client";

export const rideCreationDuration = new Histogram({
  name: "ride_creation_duration_seconds",
  help: "Duration of ride creation in seconds",
  labelNames: ["tariff_type", "status"],
});

export const rideCreationCounter = new Counter({
  name: "ride_creation_total",
  help: "Total number of ride creations",
  labelNames: ["tariff_type", "status"],
});
