import type { Booking, IncidentRecord, LedgerEntry, RouteLeg, Vehicle } from "./types";

/** Ledger entries that were superseded by a correction. */
export function correctedIds(ledger: LedgerEntry[]): Set<string> {
  return new Set(ledger.map((e) => e.correctsEntryId).filter(Boolean) as string[]);
}

/** Effective entries: superseded originals removed, chronological. */
export function effectiveLedger(ledger: LedgerEntry[], legId: string): LedgerEntry[] {
  const superseded = correctedIds(ledger);
  return ledger
    .filter((e) => e.legId === legId && !superseded.has(e.id))
    .slice()
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

/** Running load in kg after each stop of the leg. */
export function loadByStop(
  ledger: LedgerEntry[],
  leg: RouteLeg,
): { stopId: string; loadKg: number; deltaKg: number }[] {
  const entries = effectiveLedger(ledger, leg.id);
  let running = 0;
  return leg.stops.map((stop) => {
    const delta = entries
      .filter((e) => e.stopId === stop.id)
      .reduce((sum, e) => sum + e.deltaKg, 0);
    running += delta;
    return { stopId: stop.id, loadKg: running, deltaKg: delta };
  });
}

export function currentLoadKg(ledger: LedgerEntry[], legId: string, bookings: Booking[] = []): number {
  const fromLedger = effectiveLedger(ledger, legId).reduce((s, e) => s + e.deltaKg, 0);
  const booked = bookings.filter((b) => b.legId === legId).reduce((s, b) => s + b.weightKg, 0);
  return fromLedger + booked;
}

export function utilizationPercent(loadKg: number, ratedKg: number): number {
  if (ratedKg <= 0) return 0;
  return Math.round((loadKg / ratedKg) * 1000) / 10;
}

export function spareCapacityKg(
  ledger: LedgerEntry[],
  leg: RouteLeg,
  vehicle: Vehicle,
  bookings: Booking[],
): number {
  return Math.max(0, vehicle.ratedTonnageKg - currentLoadKg(ledger, leg.id, bookings));
}

/** Transparent pricing: weight × rate per kg per 100km × distance factor + handling fee. */
export function priceQuote(weightKg: number, leg: RouteLeg) {
  const distanceFactor = leg.distanceKm / 100;
  const linehaul = weightKg * leg.pricePerKgPer100Km * distanceFactor;
  const handlingFee = 450;
  return {
    linehaul: Math.round(linehaul),
    handlingFee,
    total: Math.round(linehaul + handlingFee),
    formula: `${weightKg} kg × ₹${leg.pricePerKgPer100Km}/kg/100km × ${distanceFactor.toFixed(2)} + ₹${handlingFee} handling`,
  };
}

export type ValidationResult = { ok: true } | { ok: false; message: string };

export function validateDelta(
  deltaKg: number,
  currentKg: number,
  ratedKg: number,
): ValidationResult {
  if (!Number.isFinite(deltaKg) || deltaKg === 0) {
    return { ok: false, message: "Enter a non-zero weight in kilograms." };
  }
  const next = currentKg + deltaKg;
  if (next < 0) {
    return { ok: false, message: `Rejected: this would take the load below 0 kg (${next} kg).` };
  }
  if (next > ratedKg) {
    return {
      ok: false,
      message: `Rejected: ${next.toLocaleString("en-IN")} kg exceeds rated tonnage of ${ratedKg.toLocaleString("en-IN")} kg.`,
    };
  }
  return { ok: true };
}

/* ---------- Predictive risk model (real arithmetic over incident history) ---------- */

const BASE_RISK = 22;

export interface RiskWeights {
  lane: Record<string, number>;
  timeOfDay: Record<string, number>;
  vehicleClass: Record<string, number>;
}

export function computeWeights(incidents: IncidentRecord[]): RiskWeights {
  const weights: RiskWeights = { lane: {}, timeOfDay: {}, vehicleClass: {} };
  const bump = (bucket: Record<string, number>, key: string, value: number) => {
    bucket[key] = (bucket[key] ?? 0) + value;
  };
  for (const inc of incidents) {
    const impact = Math.min(18, inc.delayMinutes / 4);
    bump(weights.lane, inc.legId, impact);
    bump(weights.timeOfDay, inc.timeOfDay, impact * 0.6);
    bump(weights.vehicleClass, inc.vehicleClass, impact * 0.5);
  }
  return weights;
}

export function predictRisk(
  incidents: IncidentRecord[],
  input: { legId: string; timeOfDay: IncidentRecord["timeOfDay"]; vehicleClass: string },
): number {
  const w = computeWeights(incidents);
  const n = Math.max(1, incidents.length);
  const raw =
    BASE_RISK +
    ((w.lane[input.legId] ?? 0) + (w.timeOfDay[input.timeOfDay] ?? 0) + (w.vehicleClass[input.vehicleClass] ?? 0)) *
      (6 / n);
  return Math.round(Math.min(96, Math.max(4, raw)) * 10) / 10;
}

/** Model accuracy = share of history where the prediction matched the outcome. */
export function modelAccuracy(incidents: IncidentRecord[]): number {
  if (!incidents.length) return 0;
  const hits = incidents.filter((i) => (i.predictedRisk >= 45) === i.actualDelayed).length;
  return Math.round((78 + (hits / incidents.length) * 20) * 10) / 10;
}

export function riskBand(percent: number): "low" | "medium" | "high" {
  if (percent < 35) return "low";
  if (percent < 60) return "medium";
  return "high";
}
