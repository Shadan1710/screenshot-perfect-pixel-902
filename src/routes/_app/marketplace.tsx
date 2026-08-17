import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Info, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui-kit/PageHeader";
import { Button } from "@/components/ui-kit/Button";
import { Field, TextInput } from "@/components/ui-kit/Field";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { priceQuote, spareCapacityKg, utilizationPercent, currentLoadKg } from "@/mock/compute";
import type { MarketplaceListing } from "@/mock/types";
import { useAppStore } from "@/state/app-store";

export const Route = createFileRoute("/_app/marketplace")({
  head: () => ({
    meta: [
      { title: "3PL Capacity Exchange — spare weight on live legs" },
      {
        name: "description",
        content:
          "3PL partners book India Post's live spare line-haul capacity per leg, priced transparently and decremented against the live capacity ledger.",
      },
      { property: "og:title", content: "3PL Capacity Exchange — spare weight on live legs" },
      {
        property: "og:description",
        content: "Transparent per-kg pricing and a booking that visibly decrements the dispatcher gauge.",
      },
    ],
  }),
  component: MarketplacePage,
});

function MarketplacePage() {
  const { activeRole, legs, listings, ledger, bookings, vehicleForLeg, addBooking, user } =
    useAppStore();
  const [pending, setPending] = useState<MarketplaceListing | null>(null);
  const [weight, setWeight] = useState("");
  const [error, setError] = useState<string | null>(null);

  const pendingLeg = pending ? legs.find((l) => l.id === pending.legId)! : null;
  const pendingSpare =
    pendingLeg ? spareCapacityKg(ledger, pendingLeg, vehicleForLeg(pendingLeg.id), bookings) : 0;
  const quote = pendingLeg ? priceQuote(Number(weight) || 0, pendingLeg) : null;

  return (
    <div className="flex flex-col gap-24">
      <PageHeader
        index="Feature 02"
        title="A capacity exchange, not a marketplace."
        intro="One asset owner — the Department of Posts — publishes spare weight on specific legs. Every booking decrements the same ledger the Capacity Engine reads."
      />

      <div className="flex items-start gap-2 rounded-[12px] border border-border px-6 py-4 text-[14px] text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-foreground" strokeWidth={1.75} />
        <span>
          Every booking travels in a segregated compartment. Liability for third-party consignments
          rests with the partner until DoP scan-in at destination.
        </span>
      </div>

      {activeRole === "dispatcher" ? (
        <section>
          <h2 className="text-[24px] tracking-[-0.02em]">Legs with sellable spare capacity</h2>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="micro-label py-4 font-medium">Leg</th>
                  <th className="micro-label py-4 font-medium">Vehicle</th>
                  <th className="micro-label py-4 text-right font-medium">Utilisation</th>
                  <th className="micro-label py-4 text-right font-medium">Spare capacity</th>
                  <th className="micro-label py-4 text-right font-medium">Booked by 3PL</th>
                </tr>
              </thead>
              <tbody>
                {legs.map((leg) => {
                  const vehicle = vehicleForLeg(leg.id);
                  const spare = spareCapacityKg(ledger, leg, vehicle, bookings);
                  const booked = bookings
                    .filter((b) => b.legId === leg.id)
                    .reduce((s, b) => s + b.weightKg, 0);
                  return (
                    <tr key={leg.id} className="border-b border-border">
                      <td className="py-4 text-[15px]">
                        {leg.originCode} → {leg.destinationCode}
                      </td>
                      <td className="num py-4 text-[14px] text-muted-foreground">
                        {vehicle.registration}
                      </td>
                      <td className="num py-4 text-right text-[15px]">
                        {utilizationPercent(
                          currentLoadKg(ledger, leg.id, bookings),
                          vehicle.ratedTonnageKg,
                        )}
                        %
                      </td>
                      <td className="num py-4 text-right text-[15px]">
                        {spare.toLocaleString("en-IN")} kg
                      </td>
                      <td className="num py-4 text-right text-[15px] text-muted-foreground">
                        {booked ? `${booked.toLocaleString("en-IN")} kg` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-[14px] text-muted-foreground">
            Switch to <span className="text-accent">3PL Partner view</span> in the top bar to book
            against these numbers.
          </p>
        </section>
      ) : (
        <section>
          <h2 className="text-[24px] tracking-[-0.02em]">Available capacity today</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing, i) => {
              const leg = legs.find((l) => l.id === listing.legId)!;
              const vehicle = vehicleForLeg(leg.id);
              const spare = spareCapacityKg(ledger, leg, vehicle, bookings);
              const indicative = priceQuote(Math.min(1000, spare), leg);
              return (
                <div key={listing.id} className="editorial-card flex flex-col">
                  <p className="num micro-label text-accent">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-4 text-[19px] tracking-[-0.02em]">{listing.lane}</h3>
                  <p className="mt-2 text-[14px] text-muted-foreground">{listing.serviceClass}</p>
                  <p className="num mt-6 text-[32px] leading-none tracking-[-0.03em]">
                    {spare.toLocaleString("en-IN")} kg
                  </p>
                  <p className="micro-label mt-2">spare weight</p>
                  <Tooltip>
                    <TooltipTrigger className="mt-6 flex items-center gap-2 text-left text-[14px] text-muted-foreground">
                      <Info className="size-4" strokeWidth={1.75} />
                      <span className="num">
                        ₹{indicative.total.toLocaleString("en-IN")} per 1,000 kg
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[260px] rounded-[8px]">
                      {indicative.formula}
                    </TooltipContent>
                  </Tooltip>
                  <div className="mt-6">
                    <Button
                      variant="primary"
                      disabled={spare <= 0}
                      onClick={() => {
                        setPending(listing);
                        setWeight("");
                        setError(null);
                      }}
                    >
                      {spare > 0 ? "Request capacity" : "Fully booked"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <Dialog open={Boolean(pending)} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent className="rounded-[16px] sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-[22px] tracking-[-0.02em]">Confirm capacity request</DialogTitle>
          </DialogHeader>
          <p className="text-[14px] text-muted-foreground">
            {pending?.lane} · spare{" "}
            <span className="num">{pendingSpare.toLocaleString("en-IN")} kg</span> available now.
          </p>
          <div className="mt-2 flex flex-col gap-6">
            <Field label="Weight to book (kg)" error={error}>
              <TextInput
                inputMode="numeric"
                value={weight}
                placeholder="e.g. 800"
                onChange={(e) => setWeight(e.target.value)}
                onBlur={() => {
                  const value = Number(weight);
                  if (!weight) return setError(null);
                  if (!Number.isFinite(value) || value <= 0)
                    return setError("Enter a positive weight in kilograms.");
                  if (value > pendingSpare)
                    return setError(
                      `Rejected: only ${pendingSpare.toLocaleString("en-IN")} kg spare on this leg.`,
                    );
                  setError(null);
                }}
              />
            </Field>
            {quote && Number(weight) > 0 ? (
              <div className="rounded-[8px] border border-border p-4 text-[14px]">
                <p className="num flex justify-between">
                  <span className="text-muted-foreground">Linehaul</span>
                  <span>₹{quote.linehaul.toLocaleString("en-IN")}</span>
                </p>
                <p className="num mt-2 flex justify-between">
                  <span className="text-muted-foreground">Handling</span>
                  <span>₹{quote.handlingFee.toLocaleString("en-IN")}</span>
                </p>
                <p className="num mt-3 flex justify-between border-t border-border pt-3">
                  <span>Total</span>
                  <span>₹{quote.total.toLocaleString("en-IN")}</span>
                </p>
                <p className="mt-3 text-[12px] text-muted-foreground">{quote.formula}</p>
              </div>
            ) : null}
            <Button
              variant="solid"
              disabled={!weight || Boolean(error) || Number(weight) <= 0}
              onClick={() => {
                if (!pending || !pendingLeg || !quote) return;
                const value = Number(weight);
                if (value > pendingSpare)
                  return setError(
                    `Rejected: only ${pendingSpare.toLocaleString("en-IN")} kg spare on this leg.`,
                  );
                addBooking({
                  listingId: pending.id,
                  legId: pending.legId,
                  stopId: pendingLeg.stops[0]!.id,
                  weightKg: value,
                  priceInr: quote.total,
                  partner: user?.organization ?? "3PL Partner",
                });
                setPending(null);
              }}
            >
              Confirm booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {bookings.length ? (
        <section>
          <h2 className="text-[24px] tracking-[-0.02em]">Bookings this session</h2>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="micro-label py-4 font-medium">Leg</th>
                  <th className="micro-label py-4 font-medium">Partner</th>
                  <th className="micro-label py-4 text-right font-medium">Weight</th>
                  <th className="micro-label py-4 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const leg = legs.find((l) => l.id === booking.legId)!;
                  return (
                    <tr key={booking.id} className="border-b border-border">
                      <td className="py-4 text-[15px]">
                        {leg.originCode} → {leg.destinationCode}
                      </td>
                      <td className="py-4 text-[14px] text-muted-foreground">{booking.partner}</td>
                      <td className="num py-4 text-right text-[15px]">
                        {booking.weightKg.toLocaleString("en-IN")} kg
                      </td>
                      <td className="num py-4 text-right text-[15px]">
                        ₹{booking.priceInr.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
