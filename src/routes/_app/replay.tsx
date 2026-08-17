import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Pause, Play } from "lucide-react";
import { PageHeader } from "@/components/ui-kit/PageHeader";
import { Button } from "@/components/ui-kit/Button";
import { replayFrames } from "@/mock/data";
import { loadByStop, utilizationPercent } from "@/mock/compute";
import { useAppStore } from "@/state/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/replay")({
  head: () => ({
    meta: [
      { title: "Digital Twin Replay — scrub a leg minute by minute" },
      {
        name: "description",
        content:
          "Scrub-through replay of a line-haul leg: position, capacity percentage and incident markers, including a seeded breakdown and reroute.",
      },
      { property: "og:title", content: "Digital Twin Replay — scrub a leg minute by minute" },
      {
        property: "og:description",
        content: "Route- and asset-framed replay with a draggable playhead and annotated incident point.",
      },
    ],
  }),
  component: ReplayPage,
});

const LEG_ID = "leg-101";
const MAX_MINUTE = 320;

function ReplayPage() {
  const { legs, ledger, vehicleForLeg } = useAppStore();
  const leg = legs.find((l) => l.id === LEG_ID)!;
  const vehicle = vehicleForLeg(LEG_ID);
  const frames = replayFrames.filter((f) => f.legId === LEG_ID);

  const [minute, setMinute] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(4);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setMinute((m) => {
        if (m >= MAX_MINUTE) {
          setPlaying(false);
          return MAX_MINUTE;
        }
        return Math.min(MAX_MINUTE, m + speed);
      });
    }, 120);
    return () => clearInterval(id);
  }, [playing, speed]);

  const frame = useMemo(() => {
    const passed = frames.filter((f) => f.minute <= minute);
    return passed[passed.length - 1] ?? frames[0]!;
  }, [frames, minute]);

  const stopLoads = loadByStop(ledger, leg);
  const stopIndex = leg.stops.findIndex((s) => s.id === frame.stopId);
  const load = stopLoads[stopIndex]?.loadKg ?? 0;
  const util = utilizationPercent(load, vehicle.ratedTonnageKg);
  const progress = minute / MAX_MINUTE;
  const incidentFrame = frames.find((f) => f.incidentId);
  const atIncident = Boolean(incidentFrame && minute >= incidentFrame.minute && minute < incidentFrame.minute + 60);

  return (
    <div className="flex flex-col gap-24">
      <PageHeader
        index="Feature 03"
        title="Replay the leg, not the driver."
        intro="Every frame is keyed to Truck ID and Leg ID. Scrub the playhead to see position, capacity and incidents move together."
      />

      <section className="editorial-card p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <p className="micro-label">Leg {leg.id} · Truck {vehicle.id}</p>
            <p className="num mt-3 text-[15px] text-muted-foreground">
              {vehicle.registration} · {leg.originCode} → {leg.destinationCode} · {leg.distanceKm} km
            </p>
          </div>
          <p className="num display-md">{util}%</p>
        </div>

        {/* Schematic route */}
        <div className="mt-12">
          <svg viewBox="0 0 1000 120" className="h-[120px] w-full" role="img" aria-label="Schematic route line">
            <line x1="20" y1="80" x2="980" y2="80" stroke="var(--color-border)" strokeWidth="2" />
            <line
              x1="20"
              y1="80"
              x2={20 + progress * 960}
              y2="80"
              stroke="var(--color-accent)"
              strokeWidth="2"
            />
            {leg.stops.map((stop, i) => {
              const x = 20 + (i / (leg.stops.length - 1)) * 960;
              return (
                <g key={stop.id}>
                  <circle cx={x} cy={80} r={5} fill="var(--color-background)" stroke="var(--color-border)" strokeWidth="2" />
                  <text x={x} y={108} textAnchor="middle" fontSize="12" fill="var(--color-muted-foreground)">
                    {stop.code}
                  </text>
                </g>
              );
            })}
            {incidentFrame ? (
              <g>
                <line
                  x1={20 + incidentFrame.progress * 960}
                  y1={40}
                  x2={20 + incidentFrame.progress * 960}
                  y2={80}
                  stroke="var(--color-danger)"
                  strokeWidth="2"
                />
                <circle cx={20 + incidentFrame.progress * 960} cy={34} r={6} fill="var(--color-danger)" />
              </g>
            ) : null}
            <circle cx={20 + progress * 960} cy={80} r={9} fill="var(--color-accent)" />
          </svg>
        </div>

        <div className="mt-8">
          <input
            type="range"
            min={0}
            max={MAX_MINUTE}
            value={minute}
            onChange={(e) => {
              setPlaying(false);
              setMinute(Number(e.target.value));
            }}
            aria-label="Replay playhead"
            className="h-11 w-full accent-[var(--color-accent)]"
          />
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Button variant="primary" size="sm" onClick={() => setPlaying((p) => !p)}>
              {playing ? <Pause className="size-4" strokeWidth={1.75} /> : <Play className="size-4" strokeWidth={1.75} />}
              {playing ? "Pause" : "Play"}
            </Button>
            <div className="flex gap-2">
              {[2, 4, 8].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={cn(
                    "num rounded-pill border px-3 py-1.5 text-[12px]",
                    speed === s ? "border-accent text-accent" : "border-border text-muted-foreground",
                  )}
                >
                  {s}×
                </button>
              ))}
            </div>
            <p className="num text-[14px] text-muted-foreground">
              T+{String(Math.floor(minute / 60)).padStart(2, "0")}:
              {String(minute % 60).padStart(2, "0")} · {load.toLocaleString("en-IN")} kg ·{" "}
              {frame.speedKmph} km/h
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <p className="micro-label">Frame</p>
          <p className="mt-3 text-[19px] tracking-[-0.02em]">{frame.label}</p>
          {atIncident ? (
            <p className="mt-4 flex items-start gap-2 text-[14px] text-danger">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
              Incident: coolant failure at KM 118. Relay vehicle WB 02 AD 1145 dispatched; load
              transferred without breaking the capacity ledger.
            </p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="text-[24px] tracking-[-0.02em]">Frame timeline</h2>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="micro-label py-4 font-medium">T+</th>
                <th className="micro-label py-4 font-medium">Stop</th>
                <th className="micro-label py-4 font-medium">Event</th>
                <th className="micro-label py-4 text-right font-medium">Speed</th>
              </tr>
            </thead>
            <tbody>
              {frames.map((f) => (
                <tr
                  key={f.id}
                  className={cn("cursor-pointer border-b border-border", f.id === frame.id && "text-accent")}
                  onClick={() => {
                    setPlaying(false);
                    setMinute(f.minute);
                  }}
                >
                  <td className="num py-4 text-[14px]">{f.minute} min</td>
                  <td className="py-4 text-[14px]">
                    {leg.stops.find((s) => s.id === f.stopId)?.code ?? "—"}
                  </td>
                  <td className="py-4 text-[14px]">{f.label}</td>
                  <td className="num py-4 text-right text-[14px]">{f.speedKmph} km/h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-[13px] text-muted-foreground">
          Retention policy: full-detail frames kept 90 days, aggregated leg summaries thereafter.
        </p>
      </section>
    </div>
  );
}
