import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Button, Divider, PillGroup, buttonVariants } from "@/components/thaal/primitives";
import { ImagePicker } from "@/components/dashboard/ImagePicker";
import { useBranch } from "@/components/dashboard/BranchContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { errMsg, menuTreeQuery } from "@/lib/dashboard/menu-data";
import { ACCENT_SWATCHES, DEFAULT_THEME, themesKey, themesQuery } from "@/lib/dashboard/themes";
import { buildPublicMenu, pickTheme } from "@/lib/menu/build";
import { FONT_PAIRINGS } from "@/lib/menu/theme";
import { planFeatures } from "@/lib/plan";
import { accentWarning, isHex } from "@/lib/qr/colour";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/design")({
  head: () => ({
    meta: [{ title: "Design — Thaal" }, { name: "description", content: "Colours, type, logo and cover for your menu." }],
    links: Object.values(FONT_PAIRINGS).flatMap((f) => (f.href ? [{ rel: "stylesheet", href: f.href }] : [])),
  }),
  component: Design,
});

type Draft = { accent: string; font_pairing: string; mode: string; logo_url: string | null; cover_url: string | null };

function Design() {
  const { restaurant } = Route.useRouteContext();
  const { branch, branches } = useBranch();
  const qc = useQueryClient();
  const branchId = branch?.id ?? "";
  const canTheme = planFeatures(restaurant.plan).themes;
  const { data: themes } = useQuery(themesQuery(restaurant.id));
  const { data: menus } = useQuery({ ...menuTreeQuery(branchId), enabled: !!branchId });

  const saved = useMemo(() => (themes ? pickTheme(themes, branchId) : null), [themes, branchId]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [scope, setScope] = useState<"branch" | "all">("all");
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  useEffect(() => {
    if (!themes) return;
    const t = saved ?? DEFAULT_THEME;
    setDraft({ accent: t.accent, font_pairing: t.font_pairing, mode: t.mode, logo_url: t.logo_url, cover_url: t.cover_url });
    setScope(themes.some((x) => x.branch_id === branchId) ? "branch" : "all");
  }, [themes, saved, branchId]);

  const effective: Draft | null = draft && (canTheme ? draft : { ...draft, accent: DEFAULT_THEME.accent, font_pairing: DEFAULT_THEME.font_pairing, mode: DEFAULT_THEME.mode });
  const payload = useMemo(() => {
    if (!branch || !menus || !effective) return null;
    return buildPublicMenu(
      { id: restaurant.id, name: restaurant.name, slug: restaurant.slug, description: restaurant.description, logo_url: restaurant.logo_url, cover_url: restaurant.cover_url, currency: restaurant.currency, plan: restaurant.plan },
      branch, effective, menus,
    );
  }, [branch, menus, effective, restaurant]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const dirty = !!draft && !!themes && JSON.stringify(draft) !== JSON.stringify(saved ? { accent: saved.accent, font_pairing: saved.font_pairing, mode: saved.mode, logo_url: saved.logo_url, cover_url: saved.cover_url } : DEFAULT_THEME);
  const warning = draft && canTheme ? accentWarning(draft.accent) : null;

  const save = async () => {
    if (!effective || !themes) return;
    if (!isHex(effective.accent)) { toast.error("Pick a full hex colour, like #1E2A5A."); return; }
    setBusy(true);
    const row = { ...effective, font_pairing: effective.font_pairing as Database["public"]["Enums"]["font_pairing"], mode: effective.mode as Database["public"]["Enums"]["theme_mode"] };
    const target = branches.length > 1 && scope === "branch" ? branchId : null;
    try {
      const existing = themes.find((t) => (t.branch_id ?? null) === target);
      const res = existing
        ? await supabase.from("themes").update(row).eq("id", existing.id)
        : await supabase.from("themes").insert({ ...row, restaurant_id: restaurant.id, branch_id: target });
      if (res.error) throw res.error;
      if (!target) {
        const overrides = themes.filter((t) => t.branch_id).map((t) => t.id);
        if (overrides.length) { const { error } = await supabase.from("themes").delete().in("id", overrides); if (error) throw error; }
      }
      await qc.invalidateQueries({ queryKey: themesKey(restaurant.id) });
      toast.success(target ? `Saved for ${branch?.name}.` : "Saved. Your menu has its new look.");
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  if (!draft || !effective) return <p className="text-muted-foreground">Laying out the swatches…</p>;

  return (
    <div className="max-w-6xl">
      <p className="eyebrow">Design{branches.length > 1 && branch ? ` · ${branch.name}` : ""}</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-5xl leading-none md:text-6xl">Make it yours.</h1>
        <button onClick={() => setShowPreview(true)} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "lg:hidden")}>Preview</button>
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_400px]">
        <div className="min-w-0 space-y-10">
          {!canTheme && (
            <div className="grid gap-3 rounded-lg border border-marigold/40 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <p className="text-sm"><span className="font-display text-lg">Want your own colours and type?</span><br />
                <span className="text-muted-foreground">The Free plan uses Thaal's house look. Pro unlocks colours, fonts and dark mode. Logo and cover work on every plan.</span></p>
              <Link to="/dashboard/billing" className={buttonVariants({ variant: "accent", size: "sm" })}>See Pro</Link>
            </div>
          )}

          <fieldset disabled={!canTheme} className={cn("space-y-10", !canTheme && "pointer-events-none opacity-45")}>
            <section>
              <h2 className="text-2xl">Accent colour</h2>
              <p className="mt-1 text-sm text-muted-foreground">Used for buttons, tags and your QR codes.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {ACCENT_SWATCHES.map((s) => {
                  const on = draft.accent.toLowerCase() === s.hex.toLowerCase();
                  return (
                    <button key={s.hex} type="button" onClick={() => set("accent", s.hex)} aria-pressed={on} aria-label={s.name} title={s.name}
                      className={cn("relative h-11 w-11 rounded-full ring-offset-2 ring-offset-background transition", on ? "ring-2 ring-ink" : "hover:scale-105")}
                      style={{ background: s.hex }} />
                  );
                })}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <input type="color" aria-label="Custom colour" value={isHex(draft.accent) ? draft.accent : "#C8553D"} onChange={(e) => set("accent", e.target.value.toUpperCase())}
                  className="h-10 w-12 cursor-pointer rounded-md border border-input bg-card p-1" />
                <input aria-label="Hex colour" value={draft.accent} maxLength={7} onChange={(e) => set("accent", e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`)}
                  className="h-10 w-28 rounded-md border border-input bg-card px-3 font-mono text-sm uppercase focus:border-ink focus:outline-none" />
                <span className="text-sm text-muted-foreground">Or any colour you like</span>
              </div>
              {warning && <p className="mt-3 border-l-2 border-marigold pl-3 text-sm text-highlight">{warning}</p>}
            </section>

            <section>
              <h2 className="text-2xl">Type</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {Object.entries(FONT_PAIRINGS).map(([key, f]) => {
                  const on = draft.font_pairing === key;
                  return (
                    <button key={key} type="button" onClick={() => set("font_pairing", key)} aria-pressed={on}
                      className={cn("rounded-lg border p-4 text-left transition-colors", on ? "border-ink" : "border-hairline hover:border-ink/40")}>
                      <p className="text-3xl leading-tight" style={{ fontFamily: `"${f.display}", serif` }}>{restaurant.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: `"${f.sans}", sans-serif` }}>Shakshuka, sourdough, a very good flat white.</p>
                      <p className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">{f.label}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="text-2xl">Mode</h2>
              <PillGroup id="mode" className="mt-4" items={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} value={draft.mode} onChange={(v) => set("mode", v)} />
            </section>
          </fieldset>

          <section>
            <h2 className="text-2xl">Logo & cover</h2>
            <p className="mt-1 text-sm text-muted-foreground">Leave empty to use the ones from your profile.</p>
            <div className="mt-4 grid gap-8 sm:grid-cols-[auto_1fr]">
              <ImagePicker label="Logo" value={draft.logo_url ?? restaurant.logo_url} onChange={(v) => set("logo_url", v)} restaurantId={restaurant.id} kind="logo" previewClassName="h-24 w-24 rounded-full" />
              <ImagePicker label="Cover photo" value={draft.cover_url ?? restaurant.cover_url} onChange={(v) => set("cover_url", v)} restaurantId={restaurant.id} kind="cover" previewClassName="h-24 w-44" />
            </div>
          </section>

          <Divider />
          <div className="flex flex-wrap items-center gap-5">
            {branches.length > 1 && (
              <PillGroup id="scope" size="sm" items={[{ value: "all", label: "All branches" }, { value: "branch", label: `Only ${branch?.name ?? "this branch"}` }]} value={scope} onChange={setScope} />
            )}
            <Button variant="accent" onClick={save} disabled={busy || !dirty}>{busy ? "Saving…" : dirty ? "Save design" : "Saved"}</Button>
            {dirty && <button onClick={() => { const t = saved ?? DEFAULT_THEME; setDraft({ accent: t.accent, font_pairing: t.font_pairing, mode: t.mode, logo_url: t.logo_url, cover_url: t.cover_url }); }} className="text-sm text-muted-foreground hover:text-foreground">Undo changes</button>}
          </div>
          {branches.length > 1 && scope === "all" && themes?.some((t) => t.branch_id) && <p className="text-xs text-muted-foreground">Saving for all branches replaces any branch-only looks.</p>}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-20"><Phone payload={payload} /></div>
        </aside>
      </div>

      <AnimatePresence>
        {showPreview && (
          <motion.div className="fixed inset-0 z-[60] flex flex-col bg-background lg:hidden" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 40 }}>
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-hairline px-5">
              <span className="text-sm">Preview{dirty ? " · not saved yet" : ""}</span>
              <button onClick={() => setShowPreview(false)} className="text-sm underline underline-offset-4">Back to editing</button>
            </div>
            <PreviewFrame payload={payload} className="flex-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PreviewFrame({ payload, className }: { payload: unknown; className?: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => { if (e.origin === window.location.origin && e.data?.type === "thaal-preview-ready" && e.source === ref.current?.contentWindow) setReady(true); };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);
  useEffect(() => {
    if (ready && payload) ref.current?.contentWindow?.postMessage({ type: "thaal-preview", payload }, window.location.origin);
  }, [ready, payload]);
  return <iframe ref={ref} src="/preview" title="Menu preview" className={cn("w-full border-0 bg-background", className)} />;
}

function Phone({ payload }: { payload: unknown }) {
  return (
    <div className="mx-auto w-[380px] rounded-[44px] border border-ink/15 bg-ink p-2.5">
      <div className="overflow-hidden rounded-[36px] bg-background">
        <PreviewFrame payload={payload} className="h-[740px]" />
      </div>
      <p className="mt-2 pb-1 text-center text-[11px] text-paper/60">Live preview · unsaved changes show here first</p>
    </div>
  );
}
