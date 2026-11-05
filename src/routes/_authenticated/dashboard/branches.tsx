import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, Divider, Input, buttonVariants } from "@/components/thaal/primitives";
import { HoursEditor } from "@/components/dashboard/HoursEditor";
import { branchesKey, useBranch, type Branch } from "@/components/dashboard/BranchContext";
import { supabase } from "@/integrations/supabase/client";
import { canAddBranch } from "@/lib/plan";
import { slugify } from "@/lib/restaurant";
import { errMsg } from "@/lib/dashboard/menu-data";
import type { Hours } from "@/lib/menu/hours";

export const Route = createFileRoute("/_authenticated/dashboard/branches")({
  head: () => ({ meta: [{ title: "Branches — Thaal" }, { name: "description", content: "Addresses, phone numbers and opening hours." }] }),
  component: Branches,
});

type Draft = { id?: string; name: string; address: string; phone: string; timezone: string; opening_hours: Hours };
const fromBranch = (b: Branch): Draft => ({ id: b.id, name: b.name, address: b.address ?? "", phone: b.phone ?? "", timezone: b.timezone, opening_hours: b.opening_hours ?? {} });

function Branches() {
  const { restaurant } = Route.useRouteContext();
  const { branches, setBranchId } = useBranch();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [upsell, setUpsell] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: branchesKey(restaurant.id) });

  const startNew = () => {
    if (!canAddBranch(restaurant.plan, branches.length)) { setUpsell(true); return; }
    setEditing({ name: "", address: "", phone: "", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, opening_hours: {} });
  };

  const remove = async (b: Branch) => {
    if (branches.length <= 1) { toast.error("You need at least one branch."); return; }
    if (!confirm(`Delete ${b.name}? Its menus, dishes, tables and order history go with it.`)) return;
    const { error } = await supabase.from("branches").delete().eq("id", b.id);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success(`${b.name} deleted.`);
    setEditing(null); refresh();
  };

  return (
    <div className="max-w-3xl">
      <p className="eyebrow">Branches</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-5xl leading-none md:text-6xl">Where to find you.</h1>
        {!editing && <Button variant="outline" size="sm" onClick={startNew}>Add a branch</Button>}
      </div>

      {upsell && !editing && (
        <div className="mt-8 grid gap-4 rounded-lg border border-marigold/40 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="font-display text-xl">Opening somewhere new? Lovely.</p>
            <p className="mt-1 text-sm text-muted-foreground">More than one branch comes with the Business plan, each with its own menus, hours and tables.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/dashboard/billing" className={buttonVariants({ variant: "accent", size: "sm" })}>See Business</Link>
            <button onClick={() => setUpsell(false)} className="text-sm text-muted-foreground">Not now</button>
          </div>
        </div>
      )}

      {editing ? (
        <BranchForm
          key={editing.id ?? "new"} draft={editing} restaurantId={restaurant.id}
          onCancel={() => setEditing(null)}
          onSaved={(id) => { setEditing(null); refresh(); if (id) setBranchId(id); }}
          onDelete={editing.id ? () => remove(branches.find((b) => b.id === editing.id)!) : undefined}
        />
      ) : (
        <ul className="mt-10 border-t border-hairline">
          {branches.map((b) => {
            const days = Object.values(b.opening_hours ?? {}).filter(Boolean).length;
            return (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline py-5">
                <div className="min-w-0">
                  <p className="font-display text-2xl">{b.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[b.address, b.phone].filter(Boolean).join(" · ") || "No address yet"} · {days ? `open ${days} day${days > 1 ? "s" : ""} a week` : "no hours set"}
                  </p>
                </div>
                <Button variant="link" onClick={() => setEditing(fromBranch(b))}>Edit</Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function BranchForm({ draft, restaurantId, onCancel, onSaved, onDelete }: {
  draft: Draft; restaurantId: string; onCancel: () => void; onSaved: (newId?: string) => void; onDelete?: (() => void) | undefined;
}) {
  const [d, setD] = useState(draft);
  const [busy, setBusy] = useState(false);
  const zones = useMemo(() => { try { return Intl.supportedValuesOf("timeZone"); } catch { return [d.timezone]; } }, [d.timezone]);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!d.name.trim()) { toast.error("Give the branch a name."); return; }
    const bad = Object.entries(d.opening_hours).find(([, h]) => h && h.open === h.close);
    if (bad) { toast.error("Opening and closing times can't be the same."); return; }
    setBusy(true);
    const row = { name: d.name.trim(), address: d.address.trim() || null, phone: d.phone.trim() || null, timezone: d.timezone, opening_hours: d.opening_hours };
    try {
      if (d.id) {
        const { error } = await supabase.from("branches").update(row).eq("id", d.id);
        if (error) throw error;
        toast.success("Branch saved."); onSaved();
      } else {
        const { data, error } = await supabase.from("branches").insert({ ...row, restaurant_id: restaurantId, slug: `${slugify(d.name) || "branch"}-${Math.random().toString(36).slice(2, 6)}`, sort: 99 }).select("id").single();
        if (error) throw error;
        await supabase.from("menus").insert({ branch_id: data.id, name: "All day" });
        toast.success("Branch added. It starts with an empty All day menu."); onSaved(data.id);
      }
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={save} className="mt-10 space-y-6">
      <h2 className="text-3xl">{d.id ? `Edit ${draft.name}` : "New branch"}</h2>
      <Input label="Branch name" value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Bermondsey" />
      <Input label="Address" value={d.address} onChange={(e) => set("address", e.target.value)} placeholder="12 Druid St, London SE1" />
      <div className="grid gap-6 sm:grid-cols-2">
        <Input label="Phone" type="tel" value={d.phone} onChange={(e) => set("phone", e.target.value)} />
        <label className="block">
          <span className="mb-1.5 block text-xs text-muted-foreground">Timezone</span>
          <select value={d.timezone} onChange={(e) => set("timezone", e.target.value)} className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm focus:border-ink focus:outline-none">
            {zones.map((z) => <option key={z} value={z}>{z.replace(/_/g, " ")}</option>)}
          </select>
        </label>
      </div>
      <div>
        <p className="mb-3 text-xs text-muted-foreground">Opening hours</p>
        <HoursEditor value={d.opening_hours} onChange={(h) => set("opening_hours", h)} />
      </div>
      <Divider />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant="accent" disabled={busy}>{busy ? "Saving…" : "Save branch"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        {onDelete && <button type="button" onClick={onDelete} className="ml-auto text-sm text-alert hover:underline">Delete branch</button>}
      </div>
    </form>
  );
}
