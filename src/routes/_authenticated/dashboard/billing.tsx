import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { BottomSheet, Button, Input } from "@/components/plated/primitives";
import { PlanColumns } from "@/components/landing/Pricing";
import { supabase } from "@/integrations/supabase/client";
import { COMPARISON, formatPlanPrice, PLANS, planFeatures, planInfo, type Plan } from "@/lib/plan";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/billing")({
  head: () => ({ meta: [
    { title: "Plan & billing — Thaal" }, { name: "description", content: "Your Thaal plan, and how to upgrade." },
    { property: "og:title", content: "Plan & billing — Thaal" }, { property: "og:description", content: "Your Thaal plan, and how to upgrade." },
  ] }),
  component: BillingPage,
});

const schema = z.object({
  contact: z.string().trim().min(5, "Add a phone or WhatsApp number we can reach").max(40, "That's a bit long"),
  message: z.string().trim().max(1000, "Keep it under 1000 characters").optional(),
});

type Req = { id: string; plan: Plan; contact: string; message: string | null; status: string; created_at: string };

function BillingPage() {
  const { restaurant } = Route.useRouteContext();
  const qc = useQueryClient();
  const current = planInfo(restaurant.plan);
  const isOwner = restaurant.role === "owner";
  const [want, setWant] = useState<Plan | null>(null);
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const reqs = useQuery({
    queryKey: ["upgrade-requests", restaurant.id],
    queryFn: async (): Promise<Req[]> => {
      const { data, error } = await supabase.from("upgrade_requests").select("id, plan, contact, message, status, created_at")
        .eq("restaurant_id", restaurant.id).order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data as Req[];
    },
  });

  const send = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({ contact, message: message || undefined });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check the form");
      const { error } = await supabase.from("upgrade_requests").insert({
        restaurant_id: restaurant.id, plan: want!, contact: parsed.data.contact, message: parsed.data.message ?? null,
      });
      if (error) throw new Error("Couldn't send that. Try again in a moment.");
    },
    onSuccess: () => {
      toast.success("Got it. We'll be in touch soon.");
      setWant(null); setMessage(""); setErr(null);
      qc.invalidateQueries({ queryKey: ["upgrade-requests", restaurant.id] });
    },
    onError: (e: Error) => setErr(e.message),
  });

  const pending = (reqs.data ?? []).find((r) => r.status === "pending");
  const rank = (p: string) => PLANS.findIndex((x) => x.id === p);

  return (
    <div className="max-w-6xl">
      <p className="eyebrow">Plan & billing</p>
      <h1 className="mt-3 text-5xl md:text-6xl">You're on {current.name}.</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Online billing is coming soon. Tell us which plan you'd like and we'll switch you on.
      </p>
      {pending && (
        <p className="mt-6 border-l-2 border-marigold pl-3 text-sm">
          Your request for <strong className="font-medium">{planInfo(pending.plan).name}</strong> is with us
          ({new Date(pending.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}). We'll reach you on {pending.contact}.
        </p>
      )}

      <PlanColumns current={current.id} renderCta={(p) => {
        if (p.id === current.id) return <p className="mt-10 py-3 text-center text-sm text-muted-foreground">Your current plan</p>;
        if (rank(p.id) < rank(current.id)) return <p className="mt-10 py-3 text-center text-sm text-muted-foreground">Want to move down? Just ask.</p>;
        if (!isOwner) return <p className="mt-10 py-3 text-center text-sm text-muted-foreground">Ask the owner to upgrade</p>;
        return (
          <Button variant={p.highlight ? "accent" : "outline"} className="mt-10 w-full" onClick={() => { setErr(null); setWant(p.id); }}>
            {p.id === "business" ? "Contact us" : "Request upgrade"}
          </Button>
        );
      }} />

      <section className="mt-20">
        <h2 className="text-3xl">Side by side</h2>
        <div className="-mx-5 mt-6 overflow-x-auto px-5">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-hairline text-left">
                <th className="py-3 font-normal text-muted-foreground" />
                {PLANS.map((p) => (
                  <th key={p.id} className={cn("py-3 font-display text-xl font-normal", p.highlight && "text-highlight")}>
                    {p.name} <span className="font-sans text-xs text-muted-foreground">{formatPlanPrice(p)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.label} className="border-b border-hairline">
                  <td className="py-3 pr-4 text-muted-foreground">{row.label}</td>
                  {PLANS.map((p) => {
                    const v = row.value(planFeatures(p.id));
                    return <td key={p.id} className="py-3">{v === true ? "Yes" : v === false ? <span className="text-muted-foreground">—</span> : v}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Moving to a smaller plan never deletes anything. Extra menus, branches and themes simply pause until you upgrade again.</p>
      </section>

      {(reqs.data ?? []).length > 0 && (
        <section className="mt-16 max-w-2xl">
          <h2 className="text-3xl">Your requests</h2>
          <ul className="mt-4">
            {reqs.data!.map((r) => (
              <li key={r.id} className="flex items-baseline justify-between gap-4 border-b border-hairline py-3 text-sm">
                <span>{planInfo(r.plan).name} · {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                <span className={cn(r.status === "pending" ? "text-highlight" : "text-muted-foreground")}>
                  {r.status === "pending" ? "Waiting on us" : r.status === "done" ? "Switched on" : "Closed"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <BottomSheet open={!!want} onClose={() => setWant(null)} label="Request upgrade">
        {want && (
          <form onSubmit={(e) => { e.preventDefault(); send.mutate(); }} className="space-y-5">
            <div>
              <p className="eyebrow">{planInfo(want).name} · {formatPlanPrice(planInfo(want))} {planInfo(want).period}</p>
              <h2 className="mt-2 text-3xl">Let's switch you on.</h2>
              <p className="mt-2 text-sm text-muted-foreground">Leave a number and we'll message you to sort it out. No card needed here.</p>
            </div>
            <Input label="Phone or WhatsApp" type="tel" inputMode="tel" placeholder="+92 300 1234567" value={contact}
              onChange={(e) => setContact(e.target.value)} maxLength={40} required autoComplete="tel" />
            <label className="block">
              <span className="text-xs text-muted-foreground">Anything we should know? (optional)</span>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} rows={3}
                className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-ink focus:outline-none" />
            </label>
            {err && <p className="text-sm text-alert">{err}</p>}
            <Button type="submit" variant="accent" className="w-full" disabled={send.isPending}>
              {send.isPending ? "Sending…" : "Send request"}
            </Button>
          </form>
        )}
      </BottomSheet>
    </div>
  );
}
