import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PillGroup } from "@/components/plated/primitives";
import { useBranch } from "@/components/dashboard/BranchContext";
import { supabase } from "@/integrations/supabase/client";
import { imgSrc } from "@/lib/unsplash";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/reviews")({
  head: () => ({ meta: [
    { title: "Reviews — Plated" }, { name: "description", content: "What diners said about each dish." },
    { property: "og:title", content: "Reviews — Plated" }, { property: "og:description", content: "What diners said about each dish." },
  ] }),
  component: ReviewsPage,
});

type Review = {
  id: string; rating: number; comment: string | null; created_at: string; read_at: string | null; dish_id: string;
  dishes: { name: string; photo_url: string | null } | null; orders: { table_label: string | null } | null;
};

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("tracking-[0.15em] text-terracotta", className)} aria-label={`${value} out of 5`}>
      {"★".repeat(Math.round(value))}<span className="text-sand-deep">{"★".repeat(5 - Math.round(value))}</span>
    </span>
  );
}

function ReviewsPage() {
  const { branch } = useBranch();
  const branchId = branch?.id ?? "";
  const qc = useQueryClient();
  const key = ["reviews", branchId];
  const [rating, setRating] = useState("all");
  const [dish, setDish] = useState("all");
  const [unread, setUnread] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: key, enabled: !!branchId,
    queryFn: async (): Promise<Review[]> => {
      const { data, error } = await supabase.from("reviews")
        .select("id, rating, comment, created_at, read_at, dish_id, dishes(name, photo_url), orders!inner(table_label, branch_id)")
        .eq("orders.branch_id", branchId).order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data as unknown as Review[];
    },
  });

  const markRead = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("reviews").update({ read_at: new Date().toISOString() }).in("id", ids);
      if (error) throw error;
    },
    onMutate: (ids) => {
      const prev = qc.getQueryData<Review[]>(key);
      const at = new Date().toISOString();
      qc.setQueryData<Review[]>(key, (rs) => (rs ?? []).map((r) => (ids.includes(r.id) ? { ...r, read_at: at } : r)));
      return { prev };
    },
    onError: (_e, _v, c) => { qc.setQueryData(key, c?.prev); toast.error("Couldn't mark as read."); },
  });

  const perDish = useMemo(() => {
    const m = new Map<string, { id: string; name: string; photo: string | null; sum: number; n: number }>();
    for (const r of data) {
      const e = m.get(r.dish_id) ?? { id: r.dish_id, name: r.dishes?.name ?? "Dish", photo: r.dishes?.photo_url ?? null, sum: 0, n: 0 };
      e.sum += r.rating; e.n += 1; m.set(r.dish_id, e);
    }
    return [...m.values()].sort((a, b) => b.sum / b.n - a.sum / a.n || b.n - a.n);
  }, [data]);

  const list = data.filter((r) => (rating === "all" || r.rating === Number(rating)) && (dish === "all" || r.dish_id === dish) && (!unread || !r.read_at));
  const unreadCount = data.filter((r) => !r.read_at).length;
  const avg = data.length ? data.reduce((s, r) => s + r.rating, 0) / data.length : 0;

  return (
    <div className="max-w-6xl">
      <p className="eyebrow">Reviews{branch ? ` · ${branch.name}` : ""}</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-5xl md:text-6xl">The verdict.</h1>
        {data.length > 0 && (
          <p className="text-sm text-muted-foreground"><span className="font-display text-3xl text-foreground">{avg.toFixed(1)}</span> average from {data.length} reviews</p>
        )}
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_300px]">
        <section>
          <div className="flex flex-col gap-3 border-b border-hairline pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
              <PillGroup id="rev-rating" size="sm" value={rating} onChange={setRating}
                items={[{ value: "all", label: "All" }, ...[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n}★` }))]} />
            </div>
            <div className="flex items-center gap-4 text-sm">
              <select aria-label="Filter by dish" value={dish} onChange={(e) => setDish(e.target.value)}
                className="h-8 max-w-[12rem] rounded-md border border-hairline bg-card px-2 text-sm">
                <option value="all">All dishes</option>
                {perDish.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <label className="flex items-center gap-1.5 whitespace-nowrap text-muted-foreground">
                <input type="checkbox" checked={unread} onChange={(e) => setUnread(e.target.checked)} className="accent-terracotta" />
                Unread ({unreadCount})
              </label>
            </div>
          </div>
          {unreadCount > 0 && (
            <button type="button" onClick={() => markRead.mutate(data.filter((r) => !r.read_at).map((r) => r.id))}
              className="mt-3 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">Mark all as read</button>
          )}

          {isLoading && <p className="py-8 text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && list.length === 0 && (
            <p className="py-10 text-muted-foreground">{data.length ? "No reviews match. Try another filter." : "No reviews yet. They'll land here after diners eat."}</p>
          )}
          <ul>
            {list.map((r) => (
              <li key={r.id} className="flex gap-4 border-b border-hairline py-5">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-sand">
                  {r.dishes?.photo_url && <img src={imgSrc(r.dishes.photo_url, 160)} alt="" loading="lazy" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="font-display text-xl">{r.dishes?.name ?? "Dish"}</p>
                    <Stars value={r.rating} className="text-sm" />
                  </div>
                  {r.comment ? <p className="mt-1 text-[15px]">“{r.comment}”</p> : <p className="mt-1 text-sm italic text-muted-foreground">No comment, just stars.</p>}
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                    {r.orders?.table_label && <span>· Table {r.orders.table_label}</span>}
                    {!r.read_at ? (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-terracotta" aria-label="Unread" />
                        <button type="button" onClick={() => markRead.mutate([r.id])} className="ml-auto underline underline-offset-4 hover:text-foreground">Mark read</button>
                      </>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <aside>
          <h2 className="border-b border-hairline pb-3 text-2xl">By dish</h2>
          <ul>
            {perDish.map((d) => (
              <li key={d.id}>
                <button type="button" onClick={() => setDish(dish === d.id ? "all" : d.id)}
                  className={cn("flex w-full items-center gap-3 border-b border-hairline py-3 text-left", dish === d.id && "text-terracotta")}>
                  <span className="min-w-0 flex-1 truncate text-sm">{d.name}</span>
                  <span className="text-xs text-muted-foreground">{d.n}</span>
                  <span className="w-8 text-right font-display text-lg tabular-nums">{(d.sum / d.n).toFixed(1)}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
