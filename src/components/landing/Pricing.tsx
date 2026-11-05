import { Link } from "@tanstack/react-router";
import { buttonVariants, SectionHeading } from "@/components/thaal/primitives";
import { formatPlanPrice, PLANS } from "@/lib/plan";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/landing/TruckArt";

const CTA: Record<string, string> = { free: "Start free", pro: "Start with Pro", business: "Start with Business" };

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-7xl scroll-mt-10 px-5 py-24 md:px-10 md:py-36">
      <Reveal><SectionHeading eyebrow="Pricing" title="Start free. Pay when you grow.">The Free plan gives you a full photo menu and a QR code. Upgrade for table ordering, your own look and more branches.</SectionHeading></Reveal>
      <PlanColumns animate renderCta={(p) => (
        <Link to="/signup" className={cn(buttonVariants({ variant: p.highlight ? "accent" : "outline" }), "mt-10 w-full")}>{CTA[p.id]}</Link>
      )} />
    </section>
  );
}

/** Shared plan columns (landing + billing). */
export function PlanColumns({ renderCta, current, animate }: { renderCta: (p: (typeof PLANS)[number]) => React.ReactNode; current?: string; animate?: boolean }) {
  return (
    <div className="mt-16 grid border-t border-hairline md:grid-cols-3">
      {PLANS.map((p, i) => (
        <Reveal key={p.id} delay={animate ? i * 0.1 : 0} {...(animate ? {} : { initial: false as const })} className={cn("flex flex-col border-b border-hairline py-10 md:border-b-0 md:px-8", i > 0 && "md:border-l", i === 0 && "md:pl-0")}>
          <div className="flex items-center gap-3">
            <h3 className={cn("text-2xl", p.highlight && "text-highlight")}>{p.name}</h3>
            {current === p.id
              ? <span className="rounded-full border border-hairline px-2 py-0.5 text-[10px] uppercase tracking-widest">Your plan</span>
              : p.highlight && <span className="text-[10px] uppercase tracking-widest text-highlight">Most loved</span>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
          <p className="mt-8 flex items-baseline gap-2"><span className="font-display text-6xl">{formatPlanPrice(p)}</span><span className="text-sm text-muted-foreground">{p.period}</span></p>
          <ul className="mt-8 flex-1 space-y-3 text-sm">
            {p.features.map((f) => <li key={f} className="flex gap-3"><span className={cn("mt-2 h-px w-3 shrink-0", p.highlight ? "bg-marigold" : "bg-ink/40")} />{f}</li>)}
          </ul>
          {renderCta(p)}
        </Reveal>
      ))}
    </div>
  );
}
