import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui-kit/PageHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/_app/ulip")({
  head: () => ({
    meta: [
      { title: "ULIP Exchange — capacity API contract" },
      {
        name: "description",
        content:
          "The DoP capacity exchange expressed as an API contract shaped to ULIP's published integration pattern, with an explicit not-yet-live disclaimer.",
      },
      { property: "og:title", content: "ULIP Exchange — capacity API contract" },
      {
        property: "og:description",
        content: "Mocked to ULIP's published contract shape: ready to onboard, not yet onboarded.",
      },
    ],
  }),
  component: UlipPage,
});

const requestJson = `POST /v1.0.0/dop/capacity/search
Host: api.ulip.dpiit.gov.in

{
  "requestId": "8f2c1e40-7d3b-4a11-9c55-2b6e7f0a4d19",
  "consumerId": "3PL-BLUEDART-0041",
  "searchCriteria": {
    "originCode": "DEL",
    "destinationCode": "JAI",
    "departureWindow": {
      "from": "2026-08-17T05:00:00Z",
      "to": "2026-08-17T09:00:00Z"
    },
    "minSpareWeightKg": 500,
    "serviceClass": "SEGREGATED_COMPARTMENT"
  }
}`;

const responseJson = `200 OK

{
  "responseId": "b71d9c02-55af-4e6d-8c10-1f9a3d7c8e22",
  "generatedAt": "2026-08-17T05:41:12Z",
  "results": [
    {
      "legId": "leg-101",
      "assetId": "veh-01",
      "assetClass": "18T_RIGID",
      "ratedCapacityKg": 18000,
      "committedLoadKg": 12600,
      "spareCapacityKg": 5400,
      "utilizationPercent": 70.0,
      "priceQuote": {
        "currency": "INR",
        "ratePerKgPer100Km": 1.85,
        "distanceKm": 268,
        "handlingFeeInr": 450
      },
      "ledgerRef": "dop:ledger:leg-101:rev-4"
    }
  ]
}`;

const mappings = [
  {
    title: "FASTag / Vahan asset verification",
    body: "Vehicle registration and rated tonnage are validated against Vahan-style asset records before a leg is published, so spare capacity can never exceed a legally rated payload.",
  },
  {
    title: "GSTN / e-Way Bill consignment linkage",
    body: "A confirmed booking references the partner's e-Way Bill number, letting the compartment's contents be reconciled with tax documentation at scan-in.",
  },
  {
    title: "Logistics Data Bank tracking events",
    body: "Digital twin frames map to LDB-style movement events (departure, transit, incident, arrival), which is what makes replay defensible as an audit source.",
  },
  {
    title: "ULIP consent and consumer onboarding",
    body: "Every request carries a consumerId issued under ULIP's consent framework; DoP publishes capacity, ULIP mediates who may read it.",
  },
];

function UlipPage() {
  return (
    <div className="flex flex-col gap-24">
      <PageHeader
        index="Feature 04"
        title="Shaped to ULIP, ready to onboard."
        intro="ULIP is India's live national logistics data exchange, already integrated with government systems and used by large private logistics operators for high-volume data calls. This screen shows how DoP's capacity exchange fits that pattern."
      />

      <div className="flex items-start gap-3 rounded-[12px] border border-warning bg-warning/10 px-6 py-5">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" strokeWidth={1.75} />
        <p className="text-[15px] text-foreground">
          Mocked to ULIP's published contract shape — not a live connection. Ready to onboard, not yet
          onboarded.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <p className="micro-label">Request</p>
          <pre className="num mt-4 overflow-x-auto rounded-[12px] border border-border bg-secondary p-6 font-mono text-[13px] leading-relaxed">
            {requestJson}
          </pre>
        </div>
        <div>
          <p className="micro-label">Response</p>
          <pre className="num mt-4 overflow-x-auto rounded-[12px] border border-border bg-secondary p-6 font-mono text-[13px] leading-relaxed">
            {responseJson}
          </pre>
        </div>
      </section>

      <section>
        <h2 className="text-[24px] tracking-[-0.02em]">Which ULIP API families this maps to</h2>
        <Accordion type="single" collapsible className="mt-8">
          {mappings.map((item) => (
            <AccordionItem key={item.title} value={item.title} className="border-border">
              <AccordionTrigger className="py-6 text-left text-[17px] tracking-[-0.02em] hover:no-underline">
                {item.title}
              </AccordionTrigger>
              <AccordionContent className="max-w-[600px] pb-6 text-[15px] text-muted-foreground">
                {item.body}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
