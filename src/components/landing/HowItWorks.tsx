import { img } from "@/lib/unsplash";
import { Drift, Reveal, Rosette } from "@/components/landing/TruckArt";

const STEPS = [
  { n: "01", t: "Add your dishes", d: "Type in names and prices, add a photo from your phone. Mark veg, spicy or sold out with one tap." },
  { n: "02", t: "Make it look like yours", d: "Your logo, colours and cover photo, so the menu feels like your place." },
  { n: "03", t: "Print QR codes for each table", d: "Download and print. Change prices any time; the codes never need reprinting." },
  { n: "04", t: "Get orders in the kitchen", d: "Guests order from the table. Tickets appear on your kitchen screen the moment they tap Order." },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative mx-auto max-w-7xl scroll-mt-10 px-5 py-24 md:px-10 md:py-36">
      <Drift className="absolute -left-20 top-10 w-40 opacity-[0.12] md:-left-28 md:w-64 md:opacity-15" range={28} rotate={12}><Rosette className="w-full" /></Drift>
      <div className="relative grid gap-14 md:grid-cols-12">
        <Reveal className="md:col-span-5">
          <p className="eyebrow mb-5">How it works</p>
          <h2 className="text-4xl leading-[1.02] md:text-6xl">Live in four steps.</h2>
          <div className="mt-12 hidden gap-4 md:grid md:grid-cols-5">
            <img src={img("1556910103-1c02745aae4d", 700, 900)} alt="Chef plating in a kitchen" loading="lazy" className="col-span-3 aspect-[3/4] w-full rounded-xl object-cover" />
            <img src={img("1509440159596-0249088772ff", 400, 600)} alt="Fresh loaves" loading="lazy" className="col-span-2 mt-24 aspect-[2/3] w-full rounded-xl object-cover" />
          </div>
        </Reveal>
        <div role="list" className="md:col-span-6 md:col-start-7">
          {STEPS.map((s, i) => (
            <Reveal role="listitem" key={s.n} delay={i * 0.08} className="group grid grid-cols-[3.5rem_1fr] gap-4 border-t border-hairline py-9 last:border-b md:grid-cols-[5rem_1fr]">
              <span className="font-display text-2xl text-highlight md:text-3xl">{s.n}</span>
              <div>
                <h3 className="text-2xl md:text-3xl">{s.t}</h3>
                <p className="mt-3 max-w-md text-muted-foreground">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
