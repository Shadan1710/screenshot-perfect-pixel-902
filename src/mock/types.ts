export type Role = "dispatcher" | "partner";

export interface User {
  id: string;
  fullName: string;
  email: string;
  organization: string;
  role: Role;
}

export interface AuthSession {
  id: string;
  user: User;
  issuedAt: string;
}

export interface Vehicle {
  id: string;
  registration: string;
  vehicleClass: string;
  ratedTonnageKg: number;
  depot: string;
  active: boolean;
}

export interface RouteStop {
  id: string;
  name: string;
  code: string;
  etaMinutesFromStart: number;
}

export interface RouteLeg {
  id: string;
  vehicleId: string;
  originCode: string;
  destinationCode: string;
  departureAt: string;
  stops: RouteStop[];
  pricePerKgPer100Km: number;
  distanceKm: number;
}

export type CapacityEventType = "sensor" | "manual" | "estimated";

export interface LedgerEntry {
  id: string;
  legId: string;
  stopId: string;
  timestamp: string;
  type: CapacityEventType;
  deltaKg: number;
  note?: string;
  correctsEntryId?: string;
  reason?: string;
}

export interface MarketplaceListing {
  id: string;
  legId: string;
  lane: string;
  departureAt: string;
  distanceKm: number;
  serviceClass: string;
}

export interface Booking {
  id: string;
  listingId: string;
  legId: string;
  stopId: string;
  weightKg: number;
  priceInr: number;
  partner: string;
  timestamp: string;
}

export interface ReplayFrame {
  id: string;
  legId: string;
  minute: number;
  progress: number;
  stopId: string;
  speedKmph: number;
  incidentId?: string;
  label: string;
}

export interface IncidentRecord {
  id: string;
  legId: string;
  timestamp: string;
  cause: string;
  timeOfDay: "morning" | "afternoon" | "night";
  vehicleClass: string;
  delayMinutes: number;
  resolved: boolean;
  predictedRisk: number;
  actualDelayed: boolean;
}

export interface RiskPrediction {
  legId: string;
  lane: string;
  timeOfDay: IncidentRecord["timeOfDay"];
  vehicleClass: string;
  riskPercent: number;
  drivers: string[];
}
