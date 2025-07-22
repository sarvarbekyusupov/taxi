export const RedisKeys = {
  driverStatus: (driverId: number | string) => `driver:${driverId}:status`,
  driverLocation: (driverId: number | string) => `driver:${driverId}:location`,
  driverRide: (driverId: number | string) => `driver:${driverId}:ride`,
  driverRating: (driverId: number | string) => `driver:${driverId}:rating`,
  driverVehicleType: (driverId: number | string) =>
    `driver:${driverId}:vehicle_type`,
  rideStatus: (rideId: number | string) => `ride:${rideId}:status`,
  allDriverStatusKeys: () => "driver:*:status",

  // 🆕 Acceptance tracking
  driverTotalAccepts: (driverId: number | string) =>
    `driver:${driverId}:accepts`,
  driverAcceptanceRate: (driverId: number | string) =>
    `driver:${driverId}:acceptance_rate`,
  driverAcceptedOffers: (driverId: number | string) =>
    `driver:${driverId}:accepted_offers`,
  driverTotalOffers: (driverId: number | string) =>
    `driver:${driverId}:total_offers`,
};



