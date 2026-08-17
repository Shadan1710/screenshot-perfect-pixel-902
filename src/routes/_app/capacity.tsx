import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { PageHeader } from "@/components/ui-kit/PageHeader";
import { Button } from "@/components/ui-kit/Button";
import { Field, TextInput } from "@/components/ui-kit/Field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  correctedIds,
  currentLoadKg,
  effectiveLedger,
  loadByStop,
  utilizationPercent,
  validateDelta,
} from "@/mock/compute";
import type { CapacityEventType, LedgerEntry } from "@/mock/types";
import { useAppStore } from "@/state/app-store";

export const Route = createFileRoute("/_app/capacity")({
  head: () => ({
    meta: [
      { title: "Capacity Engine — live vehicle utilisation" },
      {
        name: "description",
        content:
          "Live-computed vehicle loading percentage across a multi-stop route, with append-only event ledger, overrides and hard validation bounds.",
      },
      { property: "og:title", content: "Capacity Engine — live vehicle utilisation" },
      {
        property: "og:description",
        content: "Recompute loading % from real sensor, manual and estimated capacity events.",
      },
    ],
  }),
  component: CapacityPage,
});

const typeLabel: Record<CapacityEventType, string> = {
  sensor: "Sensor",
  manual: "Manual",
  estimated: "Estimated",
};

function CapacityPage() {
  const { legs, ledger, bookings, vehicleForLeg, addLedgerEntry, correctLedgerEntry } = useAppStore();
  const [legId, setLegId] = useState(legs[0]!.id);
  const leg = legs.find((l) => l.id === legId)!;
  const vehicle = vehicleForLeg(legId);

  const [activeStopId, setActiveStopId] = useState(leg.stops[0]!.id);
  const [weight, setWeight] = useState("");
  const [direction, setDirection] = useState<"load" | "unload">("load");
  const [eventType, setEventType] = useState<CapacityEventType>("manual");
  const [inputError, setInputError] = useState<string | null>(null);
  const [ledgerOpen, setLedgerOpen] = useState(true);
  const [overrideEntry, setOverrideEntry] = useState<LedgerEntry | null>(null);

  const stopLoads = useMemo(() => loadByStop(ledger, leg), [ledger, leg]);
  const totalKg = currentLoadKg(ledger, legId, bookings);
  const util = utilizationPercent(totalKg, vehicle.ratedTonnageKg);
  const entries = effectiveLedger(ledger, legId).slice().reverse();
  const superseded = correctedIds(ledger);
  const corrections = new Set(ledger.filter((e) => e.correctsEntryId).map((e) => e.id));

  const activeIndex = leg.stops.findIndex((s) => s.id === activeStopId);
  const activeLoad = stopLoads[activeIndex]?.loadKg ?? 0;
  const activeUtil = utilizationPercent(activeLoad, vehicle.ratedTonnageKg);

  function selectLeg(nextId: string) {
    setLegId(nextId);
    const next = legs.find((l) => l.id === nextId)!;
    setActiveStopId(next.stops[0]!.id);
    setInputError(null);
  }

  function applyEvent() {
    const magnitude = Number(weight);
    const delta = direction === "load" ? magnitude : -magnitude;
    const result = validateDelta(delta, totalKg, vehicle.ratedTonnageKg);
    if (!result.ok) {
      setInputError(result.message);
      return;
    }
    setInputError(null);
    addLedgerEntry({
      legId,
      stopId: activeStopId,
      type: eventType,
      deltaKg: delta,
      note: `${direction === "load" ? "Load" : "Unload"} at ${leg.stops[activeIndex]?.code ?? ""}`,
    });
    setWeight("");
  }

  return (
    <div className="flex flex-col gap-24">
      <PageHeader
        index="Feature 01"
        title="Capacity, recomputed at every stop."
        intro="Loading percentage is derived arithmetic over an append-only event ledger — never a manually typed number. Corrections append; history is never rewritten."
      />

      <section>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="micro-label">Leg</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {legs.map((option) => (
                <button
                  key={option.id}
                  onClick={() => selectLeg(option.id)}
                  className={cn(
                    "rounded-pill border px-4 py-2 text-[13px] transition-colors duration-200",
                    option.id === legId
                      ? "border-accent text-accent"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option.originCode} → {option.destinationCode}
                </button>
              ))}
            </div>
          </div>
          <p className="num text-[13px] text-muted-foreground">
            {vehicle.registration} · {vehicle.vehicleClass} · rated{" "}
            {vehicle.ratedTonnageKg.toLocaleString("en-IN")} kg
          </p>
        </div>

        {/* Route stepper — hero element */}
        <div className="mt-12 overflow-x-auto pb-4">
          <div className="flex min-w-[720px] items-end gap-6">
            {leg.stops.map((stop, i) => {
              const load = stopLoads[i]?.loadKg ?? 0;
              const pct = utilizationPercent(load, vehicle.ratedTonnageKg);
              const active = stop.id === activeStopId;
              return (
                <button
                  key={stop.id}
                  onClick={() => setActiveStopId(stop.id)}
                  className={cn(
                    "flex-1 border-t pt-6 text-left transition-colors duration-200",
                    active ? "border-accent" : "border-border hover:border-foreground/30",
                  )}
                >
                  <span className={cn("num micro-label", active && "text-accent")}>
                    {String(i + 1).padStart(2, "0")} · {stop.code}
                  </span>
                  <p className="mt-3 text-[15px]">{stop.name}</p>
                  <div className="mt-4 h-2 w-full rounded-pill bg-surface">
                    <div
                      className={cn(
                        "h-2 rounded-pill transition-all duration-500",
                        pct > 95 ? "bg-danger" : pct > 80 ? "bg-warning" : "bg-accent",
                      )}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <p className="num mt-3 text-[15px] text-muted-foreground">
                    {pct}% · {load.toLocaleString("en-IN")} kg
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="editorial-card p-8">
          <p className="micro-label">Utilisation at {leg.stops[activeIndex]?.name}</p>
          <p className="num display-md mt-4">{activeUtil}%</p>
          <p className="num mt-4 text-[15px] text-muted-foreground">
            {activeLoad.toLocaleString("en-IN")} kg of {vehicle.ratedTonnageKg.toLocaleString("en-IN")} kg
            · end-of-leg load {totalKg.toLocaleString("en-IN")} kg ({util}%)
          </p>
          <p className="mt-6 flex items-start gap-2 text-[13px] text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
            Booked 3PL weight is included in the end-of-leg figure, so the exchange and this gauge can
            never disagree.
          </p>
        </div>

        <div className="editorial-card p-8">
          <p className="micro-label">Record capacity event</p>
          <div className="mt-6 flex flex-col gap-6">
            <Field label="Weight (kg)" error={inputError}>
              <TextInput
                inputMode="numeric"
                value={weight}
                placeholder="e.g. 1200"
                onChange={(e) => setWeight(e.target.value)}
                onBlur={() => {
                  if (!weight) return setInputError(null);
                  const magnitude = Number(weight);
                  const delta = direction === "load" ? magnitude : -magnitude;
                  const result = validateDelta(delta, totalKg, vehicle.ratedTonnageKg);
                  setInputError(result.ok ? null : result.message);
                }}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              {(["load", "unload"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className={cn(
                    "min-h-11 rounded-[8px] border px-4 text-[13px] capitalize transition-colors duration-200",
                    direction === d ? "border-accent text-accent" : "border-border text-muted-foreground",
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(typeLabel) as CapacityEventType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setEventType(t)}
                  className={cn(
                    "rounded-pill border px-3 py-1.5 text-[12px] transition-colors duration-200",
                    eventType === t ? "border-accent text-accent" : "border-border text-muted-foreground",
                  )}
                >
                  {typeLabel[t]}
                </button>
              ))}
            </div>
            <Button variant="solid" onClick={applyEvent} disabled={!weight}>
              Apply to ledger
            </Button>
          </div>
        </div>
      </section>

      <section>
        <button
          className="flex w-full items-center justify-between border-b border-border pb-4"
          onClick={() => setLedgerOpen((v) => !v)}
        >
          <span className="text-[24px] tracking-[-0.02em]">Event ledger</span>
          <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <span className="num">{entries.length}</span> entries
            {ledgerOpen ? (
              <ChevronUp className="size-4" strokeWidth={1.75} />
            ) : (
              <ChevronDown className="size-4" strokeWidth={1.75} />
            )}
          </span>
        </button>

        {ledgerOpen ? (
          entries.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[15px] text-muted-foreground">
                No capacity events recorded on this leg yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="micro-label py-4 font-medium">Timestamp</th>
                    <th className="micro-label py-4 font-medium">Stop</th>
                    <th className="micro-label py-4 font-medium">Type</th>
                    <th className="micro-label py-4 text-right font-medium">Delta</th>
                    <th className="micro-label py-4 font-medium">Note</th>
                    <th className="py-4" />
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-border align-top">
                      <td className="num py-4 text-[14px] text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </td>
                      <td className="py-4 text-[14px]">
                        {leg.stops.find((s) => s.id === entry.stopId)?.code ?? "—"}
                      </td>
                      <td className="py-4">
                        <span className="rounded-pill border border-border px-3 py-1 text-[12px] text-muted-foreground">
                          {typeLabel[entry.type]}
                        </span>
                        {corrections.has(entry.id) ? (
                          <span className="ml-2 rounded-pill border border-accent px-3 py-1 text-[12px] text-accent">
                            corrected
                          </span>
                        ) : null}
                      </td>
                      <td
                        className={cn(
                          "num py-4 text-right text-[15px]",
                          entry.deltaKg < 0 ? "text-muted-foreground" : "text-foreground",
                        )}
                      >
                        {entry.deltaKg > 0 ? "+" : ""}
                        {entry.deltaKg.toLocaleString("en-IN")} kg
                      </td>
                      <td className="py-4 text-[14px] text-muted-foreground">
                        {entry.reason ? `${entry.note} — ${entry.reason}` : entry.note}
                      </td>
                      <td className="py-4 text-right">
                        <Button variant="secondary" onClick={() => setOverrideEntry(entry)}>
                          Override
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-[13px] text-muted-foreground">
                <span className="num">{superseded.size}</span> superseded entries retained for audit.
              </p>
            </div>
          )
        ) : null}
      </section>

      <OverrideDialog
        entry={overrideEntry}
        ratedKg={vehicle.ratedTonnageKg}
        currentKg={totalKg}
        onClose={() => setOverrideEntry(null)}
        onSubmit={(value, reason) => {
          if (!overrideEntry) return;
          correctLedgerEntry(overrideEntry.id, value, reason);
          setOverrideEntry(null);
        }}
      />
    </div>
  );
}

function OverrideDialog({
  entry,
  ratedKg,
  currentKg,
  onClose,
  onSubmit,
}: {
  entry: LedgerEntry | null;
  ratedKg: number;
  currentKg: number;
  onClose: () => void;
  onSubmit: (value: number, reason: string) => void;
}) {
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog
      open={Boolean(entry)}
      onOpenChange={(open) => {
        if (!open) {
          setValue("");
          setReason("");
          setError(null);
          onClose();
        }
      }}
    >
      <DialogContent className="rounded-[16px] sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-[22px] tracking-[-0.02em]">Correct ledger entry</DialogTitle>
        </DialogHeader>
        <p className="text-[14px] text-muted-foreground">
          Original delta{" "}
          <span className="num">{entry ? entry.deltaKg.toLocaleString("en-IN") : 0} kg</span>. The
          correction is appended as a new entry — the original stays in the audit trail.
        </p>
        <div className="mt-2 flex flex-col gap-6">
          <Field label="Corrected delta (kg)" error={error}>
            <TextInput
              inputMode="numeric"
              value={value}
              placeholder="e.g. 1650 or -800"
              onChange={(e) => setValue(e.target.value)}
              onBlur={() => {
                if (!value || !entry) return setError(null);
                const next = Number(value);
                const result = validateDelta(next, currentKg - entry.deltaKg, ratedKg);
                setError(result.ok ? null : result.message);
              }}
            />
          </Field>
          <Field label="Reason">
            <TextInput
              value={reason}
              placeholder="Weighbridge reading differed"
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
          <Button
            variant="solid"
            disabled={!value || !reason || Boolean(error)}
            onClick={() => {
              if (!entry) return;
              const next = Number(value);
              const result = validateDelta(next, currentKg - entry.deltaKg, ratedKg);
              if (!result.ok) return setError(result.message);
              onSubmit(next, reason);
              setValue("");
              setReason("");
            }}
          >
            Append correction
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
