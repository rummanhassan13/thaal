import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, Divider, buttonVariants } from "@/components/plated/primitives";
import { QrPreview } from "@/components/dashboard/QrPreview";
import { useBranch } from "@/components/dashboard/BranchContext";
import { supabase } from "@/integrations/supabase/client";
import { errMsg } from "@/lib/dashboard/menu-data";
import { DEFAULT_THEME, themesQuery } from "@/lib/dashboard/themes";
import { pickTheme } from "@/lib/menu/build";
import { FONT_PAIRINGS } from "@/lib/menu/theme";
import { planFeatures } from "@/lib/plan";
import { menuUrl, newQrToken, parseTableLabels, tableUrl } from "@/lib/qr/tables";
import { downloadBlob, fileSafe, qrBlob, tentsPdf, zipQrs, type QrStyle } from "@/lib/qr/render";

export const Route = createFileRoute("/_authenticated/dashboard/qr")({
  head: () => ({
    meta: [{ title: "Tables & QR codes — Plated" }, { name: "description", content: "Tables, QR codes and printable table tents." }],
    links: Object.values(FONT_PAIRINGS).flatMap((f) => (f.href ? [{ rel: "stylesheet", href: f.href }] : [])),
  }),
  component: QrPage,
});

type Table = { id: string; label: string; qr_code_token: string };
const natural = (a: Table, b: Table) => a.label.localeCompare(b.label, undefined, { numeric: true });

function QrPage() {
  const { restaurant } = Route.useRouteContext();
  const { branch } = useBranch();
  const branchId = branch?.id ?? "";
  const qc = useQueryClient();
  const pro = planFeatures(restaurant.plan).tableQr;
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const { data: themes } = useQuery(themesQuery(restaurant.id));
  const theme = (themes && pickTheme(themes, branchId)) ?? DEFAULT_THEME;
  const logo = theme.logo_url ?? restaurant.logo_url;
  const style: QrStyle = useMemo(() => ({ branded: pro, accent: theme.accent, logo }), [pro, theme.accent, logo]);
  const fonts = FONT_PAIRINGS[theme.font_pairing] ?? FONT_PAIRINGS["bricolage_figtree"]!;

  const tablesKey = ["tables", branchId];
  const { data: tables = [], isLoading } = useQuery({
    queryKey: tablesKey, enabled: !!branchId && pro,
    queryFn: async () => {
      const { data, error } = await supabase.from("tables").select("id, label, qr_code_token").eq("branch_id", branchId);
      if (error) throw error;
      return (data ?? []).sort(natural);
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: tablesKey });

  const [single, setSingle] = useState("");
  const [bulk, setBulk] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const add = async (input: string, clear: () => void) => {
    const labels = parseTableLabels(input, tables.map((t) => t.label));
    if (!labels.length) { toast.error(input.trim() ? "Those tables already exist." : "Type a table name or number."); return; }
    const { error } = await supabase.from("tables").insert(labels.map((label) => ({ branch_id: branchId, label })));
    if (error) { toast.error(errMsg(error)); return; }
    toast.success(labels.length === 1 ? `Table ${labels[0]} added.` : `${labels.length} tables added.`);
    clear(); refresh();
  };
  const rename = async (t: Table, label: string) => {
    if (!label || label === t.label) return;
    if (tables.some((x) => x.id !== t.id && x.label.toLowerCase() === label.toLowerCase())) { toast.error("There's already a table with that name."); return; }
    const { error } = await supabase.from("tables").update({ label }).eq("id", t.id);
    if (error) toast.error(errMsg(error)); else refresh();
  };
  const regenerate = async (t: Table) => {
    if (!confirm(`Make a new QR code for table ${t.label}? The old printed code will stop working.`)) return;
    const { error } = await supabase.from("tables").update({ qr_code_token: newQrToken() }).eq("id", t.id);
    if (error) toast.error(errMsg(error)); else { toast.success("New code ready. Reprint this one."); refresh(); }
  };
  const remove = async (t: Table) => {
    if (!confirm(`Delete table ${t.label}? Its QR code will stop working.`)) return;
    const { error } = await supabase.from("tables").delete().eq("id", t.id);
    if (error) toast.error(errMsg(error)); else refresh();
  };

  const download = async (url: string, name: string, kind: "png" | "svg") => {
    try { downloadBlob(await qrBlob(url, style, kind), `${fileSafe(restaurant.name)}-${fileSafe(name)}.${kind}`); }
    catch (e) { toast.error(errMsg(e)); }
  };
  const all = async () => {
    setBusy("zip");
    try { downloadBlob(await zipQrs(tables.map((t) => ({ name: `table-${t.label}`, url: tableUrl(origin, restaurant.slug, t.qr_code_token) })), style), `${fileSafe(restaurant.name)}-qr-codes.zip`); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(null); }
  };
  const tents = async () => {
    setBusy("pdf");
    try {
      downloadBlob(await tentsPdf({
        restaurant: restaurant.name, displayFont: fonts.display, sansFont: fonts.sans, accent: theme.accent, style,
        tables: tables.map((t) => ({ label: t.label, url: tableUrl(origin, restaurant.slug, t.qr_code_token) })),
      }), `${fileSafe(restaurant.name)}-table-tents.pdf`);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(null); }
  };

  const mUrl = origin ? menuUrl(origin, restaurant.slug) : "";

  return (
    <div className="max-w-5xl">
      <p className="eyebrow">QR codes{branch ? ` · ${branch.name}` : ""}</p>
      <h1 className="mt-3 text-5xl leading-none md:text-6xl">Scan, browse, order.</h1>

      {/* menu QR */}
      <section className="mt-10 grid gap-6 border-y border-hairline py-8 sm:grid-cols-[180px_1fr] sm:items-center">
        {mUrl && <QrPreview url={mUrl} style={style} className="w-40 sm:w-full" />}
        <div>
          <h2 className="text-3xl">Your menu</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {pro ? "One code for the window, flyers or socials. Browse-only, since it isn't tied to a table." : "A plain QR for your menu. Stick it on the door, the counter or every table."}
          </p>
          <p className="mt-2 break-all text-xs text-muted-foreground">{mUrl}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button size="sm" variant="ink" onClick={() => download(mUrl, "menu", "png")}>Download PNG</Button>
            <Button size="sm" variant="outline" onClick={() => download(mUrl, "menu", "svg")}>SVG</Button>
          </div>
        </div>
      </section>

      {!pro ? (
        <div className="mt-10 grid gap-4 rounded-lg border border-marigold/40 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="font-display text-2xl">Orders from the table.</p>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">Pro gives every table its own branded QR code in your colours with your logo in the middle, plus printable table tents, so diners can order and call a waiter without waving.</p>
          </div>
          <Link to="/dashboard/billing" className={buttonVariants({ variant: "accent", size: "sm" })}>See Pro</Link>
        </div>
      ) : (
        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl">Tables</h2>
              <p className="mt-1 text-sm text-muted-foreground">Each code opens your menu with ordering switched on for that table.</p>
            </div>
            {tables.length > 0 && (
              <div className="flex flex-wrap gap-3">
                <Button size="sm" variant="accent" onClick={tents} disabled={!!busy}>{busy === "pdf" ? "Making tents…" : "Print table tents (PDF)"}</Button>
                <Button size="sm" variant="outline" onClick={all} disabled={!!busy}>{busy === "zip" ? "Zipping…" : "Download all (.zip)"}</Button>
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <form onSubmit={(e) => { e.preventDefault(); void add(single, () => setSingle("")); }} className="flex gap-2">
              <input aria-label="Table name" value={single} onChange={(e) => setSingle(e.target.value)} placeholder="Table name, e.g. 12 or Window"
                className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-card px-3.5 text-sm focus:border-ink focus:outline-none" />
              <Button type="submit" variant="outline">Add</Button>
            </form>
            <form onSubmit={(e) => { e.preventDefault(); void add(bulk, () => setBulk("")); }} className="flex gap-2">
              <input aria-label="Add many tables" value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder="Add many: 1-20, Patio 1"
                className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-card px-3.5 text-sm focus:border-ink focus:outline-none" />
              <Button type="submit" variant="outline">Add all</Button>
            </form>
          </div>

          {isLoading ? <p className="mt-8 text-sm text-muted-foreground">Counting chairs…</p> : tables.length === 0 ? (
            <p className="mt-8 text-muted-foreground">No tables yet. Try "1-12" above.</p>
          ) : (
            <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {tables.map((t) => {
                const url = tableUrl(origin, restaurant.slug, t.qr_code_token);
                return (
                  <li key={t.id} className="min-w-0">
                    {origin && <QrPreview url={url} style={style} className="border border-hairline" />}
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-xs text-muted-foreground">Table</span>
                      <TableName value={t.label} onSave={(v) => rename(t, v)} />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <button onClick={() => download(url, `table-${t.label}`, "png")} className="hover:text-foreground">PNG</button>
                      <button onClick={() => download(url, `table-${t.label}`, "svg")} className="hover:text-foreground">SVG</button>
                      <button onClick={() => regenerate(t)} className="hover:text-foreground">New code</button>
                      <button onClick={() => remove(t)} aria-label={`Delete table ${t.label}`} className="hover:text-alert">Delete</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <Divider className="mt-12" />
          <p className="mt-4 text-xs text-muted-foreground">Table tents print on A4, two per page. Cut along the dashed line, then fold each one in half.</p>
        </section>
      )}
    </div>
  );
}

function TableName({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <input aria-label={`Rename table ${value}`} value={v} maxLength={40} onChange={(e) => setV(e.target.value)}
      onBlur={() => { const t = v.trim(); if (!t) setV(value); else onSave(t); }}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 font-display text-xl hover:border-hairline focus:border-ink focus:outline-none" />
  );
}
