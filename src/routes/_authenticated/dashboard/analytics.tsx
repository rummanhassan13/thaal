import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { buttonVariants, PillGroup } from "@/components/plated/primitives";
import { useBranch } from "@/components/dashboard/BranchContext";
import { supabase } from "@/integrations/supabase/client";
import { planFeatures } from "@/lib/plan";
import { formatPrice } from "@/lib/menu/types";
import { sized } from "@/lib/unsplash";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/analytics")({
  head: () => ({ meta: [
    { title: "Analytics — Thaal" }, { name: "description", content: "Scans, orders, revenue and your busiest hours." },
    { property: "og:title", content: "Analytics — Thaal" }, { property: "og:description", content: "Scans, orders, revenue and your busiest hours." },
  ] }),
  component: AnalyticsPage,
});

type Range = "today" | "7d" | "30d";
type DishStat = { id: string; name: string; photo_url: string | null; views: number; qty: number; orders: number };
type Analytics = {
  hourly: boolean; scans: number; orders: number; revenue: number;
  series: { bucket: string; scans: number; orders: number; revenue: number }[];
  heatmap: { dow: number; hour: number; orders: number; scans: number }[];
  top_viewed: DishStat[]; top_ordered: DishStat[];
  rating_avg: number | null; rating_count: number; rating_dist: Record<string, number>;
};

function rangeBounds(r: Range) {
  const to = new Date();
  const from = new Date(); from.setHours(0, 0, 0, 0);
  if (r === "7d") from.setDate(from.getDate() - 6);
  if (r === "30d") from.setDate(from.getDate() - 29);
  return { from: from.toISOString(), to: to.toISOString() };
}

function useTokens() {
  const [t, setT] = useState({ accent: "#F2A900", teal: "#1C8C8C", mist: "#D8D5CA", muted: "#5E6585", line: "rgba(30,42,90,.12)" });
  useEffect(() => {
    const s = getComputedStyle(document.documentElement);
    const v = (n: string, f: string) => s.getPropertyValue(n).trim() || f;
    setT({ accent: v("--marigold", t.accent), teal: v("--teal", t.teal), mist: v("--mist-deep", t.mist), muted: v("--muted-foreground", t.muted), line: v("--hairline", t.line) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return t;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function AnalyticsPage() {
  const { restaurant } = Route.useRouteContext();
  const { branch } = useBranch();
  const branchId = branch?.id ?? "";
  const allowed = planFeatures(restaurant.plan).analytics;
  const [range, setRange] = useState<Range>("7d");
  const [heatBy, setHeatBy] = useState<"orders" | "scans">("orders");
  const tk = useTokens();

  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics", branchId, range],
    enabled: !!branchId && allowed,
    queryFn: async () => {
      const { from, to } = rangeBounds(range);
      const { data, error } = await supabase.rpc("get_branch_analytics", { p_branch_id: branchId, p_from: from, p_to: to });
      if (error) throw error;
      return data as unknown as Analytics;
    },
  });

  const series = useMemo(() => (data?.series ?? []).map((p) => {
    const d = new Date(p.bucket);
    return { ...p, label: data?.hourly ? `${d.getHours()}:00` : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) };
  }), [data]);
  const heatMax = Math.max(1, ...(data?.heatmap ?? []).map((h) => h[heatBy]));
  const heat = (dow: number, hour: number) => data?.heatmap.find((h) => h.dow === dow && h.hour === hour)?.[heatBy] ?? 0;

  if (!allowed) {
    return (
      <div className="max-w-2xl">
        <p className="eyebrow">Analytics</p>
        <h1 className="mt-3 text-5xl md:text-6xl">Know your rush hour.</h1>
        <p className="mt-5 text-lg text-muted-foreground">See scans, orders, revenue, busiest hours and which dishes people look at but don't order. Analytics comes with Pro.</p>
        <Link to="/dashboard/billing" className={cn(buttonVariants({ variant: "accent" }), "mt-8")}>See Pro</Link>
      </div>
    );
  }

  const aov = data && data.orders ? data.revenue / data.orders : 0;
  const cur = restaurant.currency;
  const dist = data?.rating_dist ?? {};
  const distMax = Math.max(1, ...Object.values(dist));

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Analytics{branch ? ` · ${branch.name}` : ""}</p>
          <h1 className="mt-3 text-5xl md:text-6xl">How it's going.</h1>
        </div>
        <PillGroup<Range> id="an-range" value={range} onChange={setRange}
          items={[{ value: "today", label: "Today" }, { value: "7d", label: "7 days" }, { value: "30d", label: "30 days" }]} />
      </div>
      {error && <p className="mt-6 text-sm text-alert">Couldn't load analytics. Refresh to try again.</p>}

      <div className={cn("mt-10 grid grid-cols-2 border-y border-hairline md:grid-cols-4", isLoading && "opacity-50")}>
        {[
          ["Scans", data ? String(data.scans) : "–"],
          ["Orders", data ? String(data.orders) : "–"],
          ["Revenue", data ? formatPrice(Number(data.revenue), cur) : "–"],
          ["Avg. order", data ? formatPrice(Math.round(aov * 100) / 100, cur) : "–"],
        ].map(([l, v], i) => (
          <div key={l} className={cn("py-6 pr-4", i % 2 === 1 && "border-l border-hairline pl-4 md:pl-6", i === 2 && "border-t border-hairline md:border-t-0 md:border-l md:pl-6", i === 3 && "border-t border-hairline md:border-t-0")}>
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className="mt-2 font-display text-4xl md:text-5xl">{v}</p>
          </div>
        ))}
      </div>

      <section className="mt-14">
        <div className="flex items-baseline justify-between">
          <h2 className="text-3xl">Scans & orders</h2>
          <p className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-mist-deep" />Scans</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-marigold" />Orders</span>
          </p>
        </div>
        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
              <CartesianGrid vertical={false} stroke={tk.line} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: tk.muted }} interval="preserveStartEnd" minTickGap={24} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: tk.muted }} allowDecimals={false} />
              <Tooltip cursor={{ stroke: tk.line }} contentStyle={{ borderRadius: 8, border: `1px solid ${tk.line}`, fontSize: 12, boxShadow: "none" }} />
              <Line type="monotone" dataKey="scans" name="Scans" stroke={tk.mist} strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="orders" name="Orders" stroke={tk.accent} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-3xl">Busiest hours</h2>
          <PillGroup id="an-heat" size="sm" value={heatBy} onChange={setHeatBy} items={[{ value: "orders", label: "Orders" }, { value: "scans", label: "Scans" }]} />
        </div>
        <div className="-mx-5 mt-6 overflow-x-auto px-5">
          <div className="grid min-w-[640px] grid-cols-[36px_repeat(24,minmax(0,1fr))] gap-[3px] text-[10px] text-muted-foreground">
            <span />
            {Array.from({ length: 24 }, (_, h) => <span key={h} className="text-center">{h % 3 === 0 ? h : ""}</span>)}
            {DAYS.map((d, i) => (
              <div key={d} className="contents">
                <span className="self-center">{d}</span>
                {Array.from({ length: 24 }, (_, h) => {
                  const v = heat(i + 1, h);
                  return <span key={h} title={`${d} ${h}:00 · ${v} ${heatBy}`} className="aspect-square rounded-[3px] bg-mist"
                    style={v ? { backgroundColor: tk.accent, opacity: 0.15 + 0.85 * (v / heatMax) } : undefined} />;
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-14 grid gap-14 lg:grid-cols-2">
        <DishTable title="Most viewed" rows={data?.top_viewed ?? []} metric="views" />
        <DishTable title="Most ordered" rows={data?.top_ordered ?? []} metric="qty" />
      </div>

      <section className="mt-14 grid gap-8 border-t border-hairline pt-8 md:grid-cols-[240px_1fr]">
        <div>
          <h2 className="text-3xl">Ratings</h2>
          <p className="mt-4 font-display text-6xl">{data?.rating_avg != null ? Number(data.rating_avg).toFixed(1) : "–"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{data?.rating_count ?? 0} reviews in this period</p>
          <Link to="/dashboard/reviews" className={cn(buttonVariants({ variant: "link" }), "mt-4")}>Read them →</Link>
        </div>
        <ul className="space-y-2 self-end">
          {[5, 4, 3, 2, 1].map((s) => (
            <li key={s} className="flex items-center gap-3 text-sm">
              <span className="w-6 text-muted-foreground">{s}★</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-mist">
                <span className="block h-full rounded-full bg-teal" style={{ width: `${((dist[s] ?? 0) / distMax) * 100}%` }} />
              </span>
              <span className="w-8 text-right tabular-nums text-muted-foreground">{dist[s] ?? 0}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function DishTable({ title, rows, metric }: { title: string; rows: DishStat[]; metric: "views" | "qty" }) {
  const max = Math.max(1, ...rows.map((r) => r[metric]));
  return (
    <section>
      <h2 className="text-3xl">{title}</h2>
      <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-x-4 border-b border-hairline pb-2 text-xs text-muted-foreground">
        <span>Dish</span><span className="w-12 text-right">{metric === "views" ? "Views" : "Sold"}</span><span className="w-14 text-right" title="Orders containing the dish ÷ times it was opened">View → order</span>
      </div>
      {rows.length === 0 && <p className="py-6 text-sm text-muted-foreground">Nothing yet for this period.</p>}
      <ul>
        {rows.map((r) => {
          const conv = r.views ? Math.min(100, Math.round((r.orders / r.views) * 100)) : null;
          return (
            <li key={r.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-b border-hairline py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="h-9 w-9 shrink-0 overflow-hidden rounded bg-mist">
                  {r.photo_url && <img src={sized(r.photo_url, 96, 96)} alt="" loading="lazy" className="h-full w-full object-cover" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{r.name}</p>
                  <span className="mt-1 block h-[3px] rounded-full bg-marigold" style={{ width: `${(r[metric] / max) * 100}%` }} />
                </div>
              </div>
              <span className="w-12 text-right text-sm tabular-nums">{r[metric]}</span>
              <span className="w-14 text-right text-sm tabular-nums text-muted-foreground">{conv == null ? "–" : `${conv}%`}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
