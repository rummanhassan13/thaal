import { Link } from "@tanstack/react-router";
import { buttonVariants, SectionHeading } from "@/components/plated/primitives";
import { cn } from "@/lib/utils";

const PLANS = [
  { name: "Free", price: "£0", note: "forever", blurb: "For trying it out over a weekend.", features: ["1 menu", "Unlimited dishes & photos", "Basic QR code", "Plated branding"], cta: "Start free" },
  { name: "Pro", price: "£19", note: "per month", blurb: "For cafés ready to take orders.", features: ["Everything in Free", "Table ordering & payments", "Custom themes & branded QR", "Analytics", "No Plated branding"], cta: "Try Pro free", hl: true },
  { name: "Business", price: "£49", note: "per month", blurb: "For a few places under one roof.", features: ["Everything in Pro", "Multiple branches", "Shared menus & staff roles", "Priority help"], cta: "Talk to us" },
];

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-7xl scroll-mt-10 px-5 py-24 md:px-10 md:py-36">
      <SectionHeading eyebrow="Pricing" title="Fair prices. No small print.">Start free. Upgrade when the tables fill up.</SectionHeading>
      <div className="mt-16 grid border-t border-hairline md:grid-cols-3">
        {PLANS.map((p, i) => (
          <div key={p.name} className={cn("flex flex-col border-b border-hairline py-10 md:border-b-0 md:px-8", i > 0 && "md:border-l", i === 0 && "md:pl-0")}>
            <div className="flex items-center gap-3">
              <h3 className={cn("text-2xl", p.hl && "text-terracotta")}>{p.name}</h3>
              {p.hl && <span className="text-[10px] uppercase tracking-widest text-terracotta">Most loved</span>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
            <p className="mt-8 flex items-baseline gap-2"><span className="font-display text-6xl">{p.price}</span><span className="text-sm text-muted-foreground">{p.note}</span></p>
            <ul className="mt-8 flex-1 space-y-3 text-sm">
              {p.features.map((f) => <li key={f} className="flex gap-3"><span className={cn("mt-2 h-px w-3 shrink-0", p.hl ? "bg-terracotta" : "bg-ink/40")} />{f}</li>)}
            </ul>
            <Link to="/signup" className={cn(buttonVariants({ variant: p.hl ? "accent" : "outline" }), "mt-10 w-full")}>{p.cta}</Link>
          </div>
        ))}
      </div>
    </section>
  );
}
