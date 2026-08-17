import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Brain } from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/ui-kit/PageHeader";
import { Button } from "@/components/ui-kit/Button";
import { Field, Segmented, TextInput } from "@/components/ui-kit/Field";
import { modelAccuracy, predictRisk, riskBand } from "@/mock/compute";
import type { IncidentRecord } from "@/mock/types";
import { useAppStore } from "@/state/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/risk")({
  head: () => ({
    meta: [
      { title: "Predictive Delay Risk — a model that recalibrates" },
      {
        name: "description",
        content:
          "Predicted delay risk per leg, recalculated from resolved incident history with visible before/after weight shifts and model accuracy.",
      },
      { property: "og:title", content: "Predictive Delay Risk — a model that recalibrates" },
      {
        property: "og:description",
        content: "Log a resolved incident and watch the risk weights and accuracy metric move.",
      },
    ],
  }),
  component: RiskPage,
});

const bandClass = {
  low: "text-success",
  medium: "text-warning",
  high: "text-danger",
} as const;

type TimeOfDay = IncidentRecord["timeOfDay"];

function RiskPage() {
  const { legs, incidents, vehicleForLeg, addIncident } = useAppStore();
  const [legId, setLegId] = useState(legs[0]!.id);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("morning");
  const [cause, setCause] = useState("");
  const [delay, setDelay] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastChange, setLastChange] = useState<{
    lane: string;
    before: number;
    after: number;
    accuracyBefore: number;
    accuracyAfter: number;
  } | null>(null);

  const accuracy = modelAccuracy(incidents);

  const chartData = incidents.map((incident, i) => ({
    label: `#${i + 1}`,
    accuracy: modelAccuracy(incidents.slice(0, i + 1)),
  }));

  function submit() {
    const minutes = Number(delay);
    if (!cause.trim()) return setError("Describe what happened.");
    if (!Number.isFinite(minutes) || minutes <= 0) return setError("Enter the delay in minutes.");
    setError(null);
    const vehicle = vehicleForLeg(legId);
    const leg = legs.find((l) => l.id === legId)!;
    const before = predictRisk(incidents, { legId, timeOfDay, vehicleClass: vehicle.vehicleClass });
    const nextIncidents: IncidentRecord[] = [
      ...incidents,
      {
        id: "preview",
        legId,
        timestamp: new Date().toISOString(),
        cause,
        timeOfDay,
        vehicleClass: vehicle.vehicleClass,
        delayMinutes: minutes,
        resolved: true,
        predictedRisk: before,
        actualDelayed: minutes > 20,
      },
    ];
    const after = predictRisk(nextIncidents, { legId, timeOfDay, vehicleClass: vehicle.vehicleClass });
    addIncident({
      legId,
      cause,
      timeOfDay,
      vehicleClass: vehicle.vehicleClass,
      delayMinutes: minutes,
      predictedRisk: before,
      actualDelayed: minutes > 20,
    });
    setLastChange({
      lane: `${leg.originCode} → ${leg.destinationCode}`,
      before,
      after,
      accuracyBefore: accuracy,
      accuracyAfter: modelAccuracy(nextIncidents),
    });
    setCause("");
    setDelay("");
  }

  return (
    <div className="flex flex-col gap-24">
      <PageHeader
        index="Feature 05"
        title="A risk model that changes its mind."
        intro="Delay risk is recomputed from resolved incident history — lane, time of day and vehicle class weights. Log an outcome and the weights visibly move."
      />

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="editorial-card">
          <p className="micro-label">Model accuracy</p>
          <p className="num mt-4 text-[44px] leading-none tracking-[-0.03em]">{accuracy}%</p>
        </div>
        <div className="editorial-card">
          <p className="micro-label">Resolved incidents learned</p>
          <p className="num mt-4 text-[44px] leading-none tracking-[-0.03em]">{incidents.length}</p>
        </div>
        <div className="editorial-card">
          <p className="micro-label">Signals weighted</p>
          <p className="num mt-4 text-[44px] leading-none tracking-[-0.03em]">3</p>
          <p className="mt-2 text-[13px] text-muted-foreground">Lane · time of day · vehicle class</p>
        </div>
      </section>

      <section>
        <h2 className="text-[24px] tracking-[-0.02em]">Predicted delay risk by leg</h2>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="micro-label py-4 font-medium">Leg</th>
                <th className="micro-label py-4 font-medium">Vehicle class</th>
                <th className="micro-label py-4 font-medium">Dominant driver</th>
                <th className="micro-label py-4 text-right font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {legs.map((leg) => {
                const vehicle = vehicleForLeg(leg.id);
                const risk = predictRisk(incidents, {
                  legId: leg.id,
                  timeOfDay: "morning",
                  vehicleClass: vehicle.vehicleClass,
                });
                const legIncidents = incidents.filter((i) => i.legId === leg.id);
                const driver =
                  legIncidents.slice().sort((a, b) => b.delayMinutes - a.delayMinutes)[0]?.cause ??
                  "No history";
                return (
                  <tr key={leg.id} className="border-b border-border">
                    <td className="py-4 text-[15px]">
                      {leg.originCode} → {leg.destinationCode}
                    </td>
                    <td className="py-4 text-[14px] text-muted-foreground">{vehicle.vehicleClass}</td>
                    <td className="py-4 text-[14px] text-muted-foreground">{driver}</td>
                    <td className={cn("num py-4 text-right text-[17px]", bandClass[riskBand(risk)])}>
                      {risk}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[360px_1fr]">
        <div className="editorial-card p-8">
          <p className="micro-label flex items-center gap-2">
            <Brain className="size-4" strokeWidth={1.75} /> Feed back a resolved incident
          </p>
          <div className="mt-6 flex flex-col gap-6">
            <Field label="Leg">
              <select
                value={legId}
                onChange={(e) => setLegId(e.target.value)}
                className="min-h-11 w-full rounded-[8px] border border-input bg-background px-4 text-[15px] outline-none focus:border-accent"
              >
                {legs.map((leg) => (
                  <option key={leg.id} value={leg.id}>
                    {leg.originCode} → {leg.destinationCode}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Time of day">
              <Segmented<TimeOfDay>
                value={timeOfDay}
                onChange={setTimeOfDay}
                options={[
                  { value: "morning", label: "Morning" },
                  { value: "afternoon", label: "Afternoon" },
                  { value: "night", label: "Night" },
                ]}
              />
            </Field>
            <Field label="What happened" error={error}>
              <TextInput value={cause} onChange={(e) => setCause(e.target.value)} placeholder="Tyre burst" />
            </Field>
            <Field label="Actual delay (minutes)">
              <TextInput
                inputMode="numeric"
                value={delay}
                onChange={(e) => setDelay(e.target.value)}
                placeholder="32"
              />
            </Field>
            <Button variant="solid" onClick={submit} disabled={!cause || !delay}>
              Submit to model
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {lastChange ? (
            <div className="editorial-card p-8">
              <p className="micro-label">Recalibration</p>
              <p className="num mt-4 text-[28px] tracking-[-0.03em]">
                {lastChange.lane}: {lastChange.before}% → {lastChange.after}%
              </p>
              <p className="num mt-3 text-[15px] text-muted-foreground">
                Model accuracy {lastChange.accuracyBefore}% → {lastChange.accuracyAfter}%
              </p>
            </div>
          ) : (
            <div className="editorial-card p-8">
              <p className="micro-label">Recalibration</p>
              <p className="mt-4 max-w-[600px] text-[15px] text-muted-foreground">
                Submit a resolved incident to see the before/after risk weight for that lane, time of day
                and vehicle class.
              </p>
            </div>
          )}

          <div className="editorial-card p-8">
            <p className="micro-label">Accuracy across learned history</p>
            <div className="mt-6 h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[70, 100]} stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-background)",
                      fontSize: 13,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="var(--color-accent)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-[24px] tracking-[-0.02em]">Incident feed</h2>
        <div className="mt-8 flex flex-col">
          {incidents
            .slice()
            .reverse()
            .map((incident) => {
              const leg = legs.find((l) => l.id === incident.legId);
              return (
                <div key={incident.id} className="flex flex-wrap justify-between gap-4 border-b border-border py-4">
                  <div>
                    <p className="text-[15px]">{incident.cause}</p>
                    <p className="num mt-1 text-[13px] text-muted-foreground">
                      {leg ? `${leg.originCode} → ${leg.destinationCode}` : incident.legId} ·{" "}
                      {incident.vehicleClass} · {incident.timeOfDay}
                    </p>
                  </div>
                  <p className="num text-[15px] text-muted-foreground">
                    +{incident.delayMinutes} min ·{" "}
                    {new Date(incident.timestamp).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                </div>
              );
            })}
        </div>
      </section>
    </div>
  );
}
