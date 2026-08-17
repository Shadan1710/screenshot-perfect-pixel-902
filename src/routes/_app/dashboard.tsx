import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Boxes, Gauge, History, Network, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/ui-kit/PageHeader";
import { currentLoadKg, predictRisk, riskBand, utilizationPercent } from "@/mock/compute";
import { useAppStore } from "@/state/app-store";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Fleet overview — DoP Fleet Intelligence" },
      {
        name: "description",
        content:
          "Fleet overview: active vehicles, average capacity utilisation, open incidents and pending 3PL capacity bookings.",
      },
      { property: "og:title", content: "Fleet overview — DoP Fleet Intelligence" },
      {
        property: "og:description",
        content: "One screen for utilisation, incidents and capacity bookings across the line-haul fleet.",
      },
    ],
  }),
  component: DashboardPage,
});

const features = [
  {
    index: "01",
    to: "/capacity",
    icon: Gauge,
    title: "Capacity Engine",
    description: "Live loading % recomputed from an append-only event ledger.",
  },
  {
    index: "02",
    to: "/marketplace",
    icon: Boxes,
    title: "3PL Capacity Exchange",
    description: "Partners book real spare weight on a specific leg.",
  },
  {
    index: "03",
    to: "/replay",
    icon: History,
    title: "Digital Twin Replay",
    description: "Scrub a truck's day, including the seeded breakdown reroute.",
  },
  {
    index: "04",
    to: "/ulip",
    icon: Network,
    title: "ULIP Exchange",
    description: "The exchange expressed as a ULIP-shaped API contract.",
  },
  {
    index: "05",
    to: "/risk",
    icon: TrendingUp,
    title: "Predictive Risk",
    description: "Delay risk that recalibrates when incidents are resolved.",
  },
] as const;

function DashboardPage() {
  const { vehicles, legs, ledger, bookings, incidents, vehicleForLeg, user } = useAppStore();

  const utilisations = legs.map((leg) =>
    utilizationPercent(currentLoadKg(ledger, leg.id, bookings), vehicleForLeg(leg.id).ratedTonnageKg),
  );
  const avgUtil = utilisations.length
    ? Math.round((utilisations.reduce((a, b) => a + b, 0) / utilisations.length) * 10) / 10
    : 0;
  const highRisk = legs.filter((leg) => {
    const vehicle = vehicleForLeg(leg.id);
    const risk = predictRisk(incidents, {
      legId: leg.id,
      timeOfDay: "morning",
      vehicleClass: vehicle.vehicleClass,
    });
    return riskBand(risk) === "high";
  }).length;

  const stats = [
    { label: "Active vehicles", value: vehicles.filter((v) => v.active).length.toString() },
    { label: "Avg utilisation", value: `${avgUtil}%` },
    { label: "High-risk legs", value: highRisk.toString() },
    { label: "3PL bookings", value: bookings.length.toString() },
  ];

  return (
    <div className="flex flex-col gap-24">
      <PageHeader
        index={`Welcome, ${user?.fullName ?? "Dispatcher"}`}
        title="Every kilogram on the network, accounted for."
        intro="One ledger drives utilisation, spare-capacity pricing, replay and delay risk. Nothing on this dashboard is a static number."
      />

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="editorial-card">
            <p className="micro-label">{stat.label}</p>
            <p className="num mt-4 text-[44px] leading-none tracking-[-0.03em]">{stat.value}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-[24px] tracking-[-0.02em]">Operational modules</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Link
              key={feature.to}
              to={feature.to}
              className="editorial-card flex flex-col hover:-translate-y-1"
            >
              <p className="num micro-label text-accent">{feature.index}</p>
              <feature.icon className="mt-6 size-6 text-foreground" strokeWidth={1.75} />
              <h3 className="mt-4 text-[19px] tracking-[-0.02em]">{feature.title}</h3>
              <p className="mt-2 text-[15px] text-muted-foreground">{feature.description}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-[14px] text-accent">
                Open <ArrowRight className="size-4" strokeWidth={1.75} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[12px] bg-ink px-8 py-16 text-ink-foreground md:px-16">
        <p className="micro-label text-ink-foreground/70">Problem statement SIH260455</p>
        <p className="mt-6 max-w-[600px] text-[26px] leading-tight tracking-[-0.03em]">
          India Post moves mail on a fleet whose spare capacity is invisible. This platform makes that
          capacity measurable, sellable and auditable.
        </p>
      </section>
    </div>
  );
}
