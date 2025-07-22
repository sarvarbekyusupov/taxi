import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Tariff } from "../tariff/entities/tariff.entity";
import { Histogram, Counter, register } from "prom-client";
import { TariffType } from "./enums/ride.enums";

// Prometheus metrikalar
const fareCalculationDuration = new Histogram({
  name: "fare_calculation_duration_seconds",
  help: "Duration of fare calculation operations",
  buckets: [0.1, 0.3, 0.5, 1, 2],
});

const fareCalculationCounter = new Counter({
  name: "fare_calculation_total",
  help: "Total fare calculation attempts",
  labelNames: ["status"],
});

// Register metrics once
register.registerMetric(fareCalculationDuration);
register.registerMetric(fareCalculationCounter);

@Injectable()
export class FareCalculationService {
  private readonly logger = new Logger(FareCalculationService.name);

  constructor(
    @InjectRepository(Tariff)
    private readonly tariffRepo: Repository<Tariff>
  ) {}

  async calculateFare(
    tariffType: TariffType,
    serviceAreaId: number,
    distanceKm: number,
    durationMin: number
  ): Promise<number> {
    const timer = fareCalculationDuration.startTimer();

    try {
      const tariff = await this.tariffRepo.findOne({
        where: {
          name: tariffType, // <-- Correct way to query relation
          service_area: { id: serviceAreaId },
          is_active: true,
        },
      });

      if (!tariff) {
        this.logger.warn(
          `Tariff not found for car type ${tariffType} in service area ${serviceAreaId}`
        );
        // fareCalculationCounter.inc({ status: "not_found" });
        throw new NotFoundException(
          `No active tariff found for the specified car type and service area.`
        );
      }

      const { base_fare, per_km_rate, per_minute_rate, minimum_fare } = tariff;

      // NaN tekshiruv
      if (
        [base_fare, per_km_rate, per_minute_rate, minimum_fare].some((v) =>
          isNaN(Number(v))
        )
      ) {
        this.logger.error("Tariff values are invalid (NaN)", {
          tariffId: tariff.id,
        });
        fareCalculationCounter.inc({ status: "invalid_tariff" });
        throw new Error("Tariff contains invalid numerical values");
      }

      const rawFare =
        Number(base_fare) +
        Number(per_km_rate) * distanceKm +
        Number(per_minute_rate) * durationMin;

      const finalFare = Math.max(rawFare, Number(minimum_fare));
      fareCalculationCounter.inc({ status: "success" });
      return finalFare;
    } catch (err) {
      this.logger.error("Fare calculation failed", {
        tariffType,
        serviceAreaId,
        error: err.message,
      });
      fareCalculationCounter.inc({ status: "error" });
      throw err;
    } finally {
      timer();
    }
  }
}
