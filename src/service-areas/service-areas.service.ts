import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreateServiceAreaDto } from "./dto/create-service-area.dto";
import { UpdateServiceAreaDto } from "./dto/update-service-area.dto";
import { ServiceArea } from "./entities/service-area.entity";

@Injectable()
export class ServiceAreaService {
  constructor(
    @InjectRepository(ServiceArea)
    private readonly repo: Repository<ServiceArea>
  ) {}

  async create(dto: CreateServiceAreaDto): Promise<ServiceArea> {
    const area = this.repo.create(dto);
    return await this.repo.save(area);
  }

  async findAll(): Promise<ServiceArea[]> {
    return this.repo.find({
      relations: ["tariffs", "daily_stats"],
      order: { id: "ASC" },
    });
  }

  async findOne(id: number): Promise<ServiceArea> {
    const area = await this.repo.findOne({
      where: { id },
      relations: ["tariffs", "daily_stats"],
    });

    if (!area) {
      throw new NotFoundException(`Service area with ID ${id} not found`);
    }

    return area;
  }

  async update(id: number, dto: UpdateServiceAreaDto): Promise<ServiceArea> {
    const existing = await this.repo.findOneBy({ id });
    if (!existing) {
      throw new NotFoundException(`Service area with ID ${id} not found`);
    }

    const updated = this.repo.merge(existing, dto);
    return await this.repo.save(updated);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.repo.findOneBy({ id });
    if (!existing) {
      throw new NotFoundException(`Service area with ID ${id} not found`);
    }

    await this.repo.remove(existing);
  }

  /**
   * Finds the most specific active service area for a given set of coordinates.
   * If a point is in multiple areas, it returns the one with the smallest radius.
   * @param lat The latitude of the location.
   * @param lng The longitude of the location.
   * @returns The matching ServiceArea or null if none are found.
   */
  async findAreaByCoordinates(
    lat: number,
    lng: number
  ): Promise<ServiceArea | null> {
    const earthRadiusKm = 6371;

    // First, let's see what service areas exist for debugging
    const allAreas = await this.repo
      .createQueryBuilder("area")
      .where("area.is_active = :isActive", { isActive: true })
      .getMany();

    console.log("All active service areas:", allAreas);

    // Calculate distance for each area manually to debug
    for (const area of allAreas) {
      // FIX: Convert string values to numbers using parseFloat or Number()
      const centerLat = parseFloat(area.center_lat as any);
      const centerLng = parseFloat(area.center_lng as any);
      const radiusKm = parseFloat(area.radius_km as any);

      // Validate the parsed numbers
      if (isNaN(centerLat) || isNaN(centerLng) || isNaN(radiusKm)) {
        console.error(`Invalid numeric values for area ${area.name}:`, {
          centerLat: area.center_lat,
          centerLng: area.center_lng,
          radiusKm: area.radius_km,
        });
        continue;
      }

      // Manual distance calculation using Haversine formula
      const toRadians = (degrees: number) => degrees * (Math.PI / 180);

      const dLat = toRadians(centerLat - lat);
      const dLng = toRadians(centerLng - lng);

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat)) *
          Math.cos(toRadians(centerLat)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = earthRadiusKm * c;

      console.log(`Area: ${area.name}`);
      console.log(`  Center: ${centerLat}, ${centerLng}`);
      console.log(`  Radius: ${radiusKm} km`);
      console.log(`  Search point: ${lat}, ${lng}`);
      console.log(`  Calculated distance: ${distance.toFixed(2)} km`);
      console.log(`  Within radius: ${distance <= radiusKm}`);
      console.log("---");
    }

    // This formula calculates the great-circle distance between two points on a sphere.
    // It's used directly in the SQL query for efficiency.
    const distanceFormula = `(${earthRadiusKm} * ACOS(COS(RADIANS(:lat)) * COS(RADIANS(CAST(area.center_lat AS FLOAT))) * COS(RADIANS(CAST(area.center_lng AS FLOAT)) - RADIANS(:lng)) + SIN(RADIANS(:lat)) * SIN(RADIANS(CAST(area.center_lat AS FLOAT)))))`;

    // Use the Query Builder to construct the database query.
    const queryBuilder = this.repo
      .createQueryBuilder("area")
      // Select all columns from the service area and add a calculated 'distance' column.
      .addSelect(distanceFormula, "distance")
      // Safely pass parameters to the query to prevent SQL injection.
      .setParameters({ lat, lng, isActive: true })
      // Filter for active service areas only.
      .where("area.is_active = :isActive")
      // Further filter to include only areas where the calculated distance
      // is less than or equal to the area's defined radius.
      .andWhere(`${distanceFormula} <= CAST(area.radius_km AS FLOAT)`)
      // If the point is in multiple overlapping areas, get the smallest (most specific) one first.
      .orderBy("CAST(area.radius_km AS FLOAT)", "ASC");

    try {
      // Log the generated SQL for debugging
      const [sql, parameters] = queryBuilder.getQueryAndParameters();
      console.log("Generated SQL:", sql);
      console.log("Parameters:", parameters);

      const result = await queryBuilder.getOne();
      console.log("Query result:", result);

      return result;
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    }
  }
}
