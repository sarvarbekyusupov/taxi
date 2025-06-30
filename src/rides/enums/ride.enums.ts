// src/rides/enums/ride.enums.ts
export enum PaymentMethod {
  CASH = "cash",
  CARD = "card",
  WALLET = "wallet",
}

export enum RideType {
  STANDARD = "standard",
  OPEN_TRIP = "open_trip",
}

export enum RideStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  STARTED = "started",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  PAID = "paid",
}

export enum TariffType {
  ECONOMY = "economy",
  COMFORT = "comfort",
  BUSINESS = "business",
  TIME_BASED = "time_based",
}
