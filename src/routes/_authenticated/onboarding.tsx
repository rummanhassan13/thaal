import { useEffect, useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Wordmark } from "@/components/plated/Wordmark";
import { Button, Divider, Input } from "@/components/plated/primitives";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyRestaurant, slugify } from "@/lib/restaurant";

const CURRENCIES = ["GBP", "EUR", "USD", "AUD", "CAD", "INR", "AED", "SGD"];

export const Route = createFileRoute("/_authenticated/onboarding")({
  beforeLoad: async ({ context }) => {
    if (await fetchMyRestaurant(context.user.id)) throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [
    { title: "Set up your restaurant — Plated" }, { name: "description", content: "A few details and your menu is ready to build." },
    { property: "og:title", content: "Set up your restaurant — Plated" }, { property: "og:description", content: "A few details and your menu is ready to build." },
  ] }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [currency, setCurrency] = useState("GBP");
  const [branch, setBranch] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!slugTouched) setSlug(slugify(name)); }, [name, slugTouched]);
  useEffect(() => {
    setAvailable(null);
    if (slug.length < 2) return;
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc("slug_available", { _slug: slug });
      setAvailable(!!data);
    }, 300);
    return () => clearTimeout(t);
  }, [slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || slug.length < 2 || !branch.trim()) return setError("Fill in all four, then we're off.");
    if (available === false) return setError("That link is taken. Try another.");
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const { data: r, error: e1 } = await supabase.from("restaurants")
        .insert({ name: name.trim(), slug, currency, owner_id: auth.user!.id }).select("id").single();
      if (e1) throw e1;
      const { data: b, error: e2 } = await supabase.from("branches")
        .insert({ restaurant_id: r.id, name: branch.trim(), slug: slugify(branch) || "main", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
        .select("id").single();
      if (e2) throw e2;
      const { error: e3 } = await supabase.from("themes").insert({ restaurant_id: r.id });
      if (e3) throw e3;
      const { error: e4 } = await supabase.from("menus").insert({ branch_id: b.id, name: "All day" });
      if (e4) throw e4;
      navigate({ to: "/dashboard" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String((err as { message?: string })?.message ?? err);
      setError(msg.includes("duplicate") ? "That link is taken. Try another." : msg);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-6 md:px-14">
      <Wordmark />
      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-lg py-16">
        <p className="eyebrow">Step 1 of 1</p>
        <h1 className="mt-4 text-5xl leading-none md:text-6xl">Tell us about your place.</h1>
        <div className="mt-12 space-y-6">
          <Input label="Restaurant name" placeholder="Lemon & Rye" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <div>
            <Input label="Menu link" value={slug} onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }} />
            <p className="mt-1.5 text-xs text-muted-foreground">
              plated.app/m/<span className="text-foreground">{slug || "your-place"}</span>
              {available === true && <span className="ml-2 text-olive">available</span>}
              {available === false && <span className="ml-2 text-terracotta">taken</span>}
            </p>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted-foreground">Currency</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm focus:border-ink focus:outline-none">
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <Input label="First branch" placeholder="e.g. Bermondsey, or Main" value={branch} onChange={(e) => setBranch(e.target.value)} />
        </div>
        <Divider className="my-10" />
        {error && <p className="mb-4 text-sm text-terracotta">{error}</p>}
        <Button variant="accent" size="lg" type="submit" disabled={busy}>{busy ? "Setting the table…" : "Open the doors"}</Button>
      </motion.form>
    </div>
  );
}
