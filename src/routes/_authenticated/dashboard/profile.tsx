import { useEffect, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button, Divider, Input, Toggle } from "@/components/plated/primitives";
import { ImagePicker } from "@/components/dashboard/ImagePicker";
import { supabase } from "@/integrations/supabase/client";
import { CURRENCIES, slugify } from "@/lib/restaurant";
import { errMsg } from "@/lib/dashboard/menu-data";

export const Route = createFileRoute("/_authenticated/dashboard/profile")({
  head: () => ({ meta: [{ title: "Restaurant profile — Plated" }, { name: "description", content: "Name, link, logo, cover and publishing." }] }),
  component: Profile,
});

const selectCls = "h-11 w-full rounded-lg border border-input bg-card px-3 text-sm focus:border-ink focus:outline-none";

function Profile() {
  const { restaurant: r } = Route.useRouteContext();
  const router = useRouter();
  const [form, setForm] = useState({ name: r.name, slug: r.slug, description: r.description ?? "", currency: r.currency, logo_url: r.logo_url, cover_url: r.cover_url });
  const [published, setPublished] = useState(r.published);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    setAvailable(null);
    if (form.slug === r.slug || form.slug.length < 2) return undefined;
    const t = setTimeout(async () => setAvailable(!!(await supabase.rpc("slug_available", { _slug: form.slug })).data), 300);
    return () => clearTimeout(t);
  }, [form.slug, r.slug]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Your restaurant needs a name."); return; }
    if (form.slug.length < 2) { toast.error("Your menu link is too short."); return; }
    if (available === false) { toast.error("That link is taken. Try another."); return; }
    setBusy(true);
    const { error } = await supabase.from("restaurants").update({
      name: form.name.trim(), slug: form.slug, description: form.description.trim() || null,
      currency: form.currency, logo_url: form.logo_url, cover_url: form.cover_url,
    }).eq("id", r.id);
    setBusy(false);
    if (error) { toast.error(error.message.includes("duplicate") ? "That link is taken. Try another." : errMsg(error)); return; }
    toast.success("Saved.");
    router.invalidate();
  };

  const togglePublish = async (v: boolean) => {
    setPublished(v);
    const { error } = await supabase.from("restaurants").update({ published: v }).eq("id", r.id);
    if (error) { setPublished(!v); { toast.error(errMsg(error)); return; } }
    toast.success(v ? "You're live. Diners can see your menu." : "Unpublished. Only you can see it now.");
    router.invalidate();
  };

  return (
    <div className="max-w-3xl">
      <p className="eyebrow">Profile</p>
      <h1 className="mt-3 text-5xl leading-none md:text-6xl">The basics.</h1>

      <div className="mt-10 flex items-center justify-between gap-6 border-y border-hairline py-5">
        <div>
          <p className="font-medium">{published ? "Published" : "Not published"}</p>
          <p className="text-sm text-muted-foreground">{published ? "Anyone with your link or QR code can see the menu." : "Flip this when you're ready for diners."}</p>
        </div>
        <Toggle checked={published} onChange={togglePublish} label="Publish menu" />
      </div>

      <form onSubmit={save} className="mt-10 space-y-6">
        <Input label="Restaurant name" value={form.name} onChange={(e) => set("name", e.target.value)} />
        <div>
          <Input label="Menu link" value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))} />
          <p className="mt-1.5 text-xs text-muted-foreground">
            plated.app/m/<span className="text-foreground">{form.slug}</span>
            {available === true && <span className="ml-2 text-teal-ink">available</span>}
            {available === false && <span className="ml-2 text-alert">taken</span>}
            {form.slug !== r.slug && <span className="ml-2">· old QR codes will stop working</span>}
          </p>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-xs text-muted-foreground">Short description</span>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} maxLength={280}
            placeholder="Sourdough, slow coffee and long lunches."
            className="w-full rounded-lg border border-input bg-card px-3.5 py-3 text-sm focus:border-ink focus:outline-none" />
        </label>
        <label className="block max-w-[12rem]">
          <span className="mb-1.5 block text-xs text-muted-foreground">Currency</span>
          <select value={form.currency} onChange={(e) => set("currency", e.target.value)} className={selectCls}>
            {(CURRENCIES.includes(form.currency) ? CURRENCIES : [form.currency, ...CURRENCIES]).map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <Divider />
        <div className="grid gap-8 sm:grid-cols-[auto_1fr]">
          <ImagePicker label="Logo" value={form.logo_url} onChange={(v) => set("logo_url", v)} restaurantId={r.id} kind="logo" previewClassName="h-24 w-24 rounded-full" />
          <ImagePicker label="Cover photo" value={form.cover_url} onChange={(v) => set("cover_url", v)} restaurantId={r.id} kind="cover" previewClassName="h-24 w-44" />
        </div>
        <p className="text-xs text-muted-foreground">Photos are resized and compressed for you, so they load fast on phones.</p>
        <Divider />
        <Button type="submit" variant="accent" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
      </form>
    </div>
  );
}
