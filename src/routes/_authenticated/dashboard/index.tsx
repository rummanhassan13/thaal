import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { buttonVariants, Divider } from "@/components/plated/primitives";
import { useBranch } from "@/components/dashboard/BranchContext";
import { supabase } from "@/integrations/supabase/client";
import { menuTreeQuery } from "@/lib/dashboard/menu-data";
import { formatPrice } from "@/lib/menu/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/")({ component: Overview });

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
}

function Overview() {
  const { restaurant } = Route.useRouteContext();
  const { branch } = useBranch();
  const branchId = branch?.id ?? "";

  const stats = useQuery({
    queryKey: ["overview", branchId],
    enabled: !!branchId,
    refetchInterval: 30_000,
    queryFn: async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const [orders, requests, tables] = await Promise.all([
        supabase.from("orders").select("total, status").eq("branch_id", branchId).gte("created_at", start.toISOString()),
        supabase.from("service_requests").select("type").eq("branch_id", branchId).eq("status", "open"),
        supabase.from("tables").select("id", { count: "exact", head: true }).eq("branch_id", branchId),
      ]);
      const live = (orders.data ?? []).filter((o) => o.status !== "cancelled");
      return {
        orders: live.length,
        revenue: live.reduce((s, o) => s + Number(o.total), 0),
        waiter: (requests.data ?? []).filter((r) => r.type === "waiter").length,
        bill: (requests.data ?? []).filter((r) => r.type === "bill").length,
        tables: tables.count ?? 0,
      };
    },
  });
  const tree = useQuery({ ...menuTreeQuery(branchId), enabled: !!branchId });

  const dishes = (tree.data ?? []).flatMap((m) => m.categories.flatMap((c) => c.dishes));
  const hoursSet = branch ? Object.values(branch.opening_hours ?? {}).some(Boolean) : false;
  const checklist = [
    { done: dishes.length > 0, label: "Add your first dishes", to: "/dashboard/menu" as const },
    { done: dishes.length > 0 && dishes.some((d) => d.photo_url), label: "Upload a few photos", to: "/dashboard/menu" as const },
    { done: hoursSet, label: "Set your opening hours", to: "/dashboard/branches" as const },
    { done: (stats.data?.tables ?? 0) > 0, label: "Print your QR codes", to: "/dashboard/qr" as const },
    { done: restaurant.published, label: "Publish your menu", to: "/dashboard/profile" as const },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const s = stats.data;
  const requests = (s?.waiter ?? 0) + (s?.bill ?? 0);

  return (
    <div className="max-w-5xl">
      <p className="eyebrow">Overview{branch ? ` · ${branch.name}` : ""}</p>
      <h1 className="mt-3 text-5xl leading-[0.95] md:text-7xl">{greeting()}, {restaurant.name}.</h1>
      <p className="mt-4 text-muted-foreground">
        {restaurant.published ? "Your menu is live." : "Your menu isn't published yet. Nobody can see it but you."}
      </p>

      <div className="mt-12 grid grid-cols-2 border-y border-hairline md:grid-cols-3">
        <Stat label="Orders today" value={s ? String(s.orders) : "–"} />
        <Stat label="Revenue today" value={s ? formatPrice(s.revenue, restaurant.currency) : "–"} className="border-l border-hairline pl-4 md:pl-6" />
        <Stat
          label="Open requests"
          value={s ? String(requests) : "–"}
          note={s && requests > 0 ? `${s.waiter} waiter · ${s.bill} bill` : "All quiet"}
          accent={requests > 0}
          className="col-span-2 border-t border-hairline md:col-span-1 md:border-t-0 md:border-l md:pl-6"
        />
      </div>

      <div className="mt-14 grid gap-14 md:grid-cols-[1.3fr_1fr]">
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="text-3xl">Getting set up</h2>
            <span className="text-sm text-muted-foreground">{doneCount} of {checklist.length}</span>
          </div>
          <ul className="mt-5">
            {checklist.map((c) => (
              <li key={c.label} className="border-t border-hairline last:border-b">
                <Link to={c.to} className="group flex items-center gap-4 py-4">
                  <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px]", c.done ? "border-olive bg-olive text-paper" : "border-sand-deep")}>
                    {c.done ? "✓" : ""}
                  </span>
                  <span className={cn("flex-1", c.done && "text-muted-foreground line-through decoration-1")}>{c.label}</span>
                  <span className="text-sm text-muted-foreground transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-3xl">Jump to</h2>
          <div className="mt-5 flex flex-col items-start gap-4">
            <Link to="/m/$slug" params={{ slug: restaurant.slug }} target="_blank" className={buttonVariants({ variant: "ink" })}>View your menu</Link>
            <Divider className="my-1" />
            <Link to="/dashboard/menu" className={buttonVariants({ variant: "link" })}>Edit dishes</Link>
            <Link to="/dashboard/orders" className={buttonVariants({ variant: "link" })}>See orders</Link>
            <Link to="/dashboard/branches" className={buttonVariants({ variant: "link" })}>Opening hours</Link>
            <Link to="/dashboard/profile" className={buttonVariants({ variant: "link" })}>Logo & cover photo</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, note, accent, className }: { label: string; value: string; note?: string; accent?: boolean; className?: string }) {
  return (
    <div className={cn("py-6 pr-4", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-2 font-display text-4xl md:text-5xl", accent && "text-terracotta")}>{value}</p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}
