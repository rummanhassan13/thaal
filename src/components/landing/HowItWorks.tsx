import { img } from "@/lib/unsplash";

const STEPS = [
  { n: "01", t: "Add your dishes", d: "Type in names and prices, add a photo from your phone. Mark veg, spicy or sold out with one tap." },
  { n: "02", t: "Make it look like yours", d: "Your logo, colours and cover photo, so the menu feels like your place." },
  { n: "03", t: "Print QR codes for each table", d: "Download and print. Change prices any time; the codes never need reprinting." },
  { n: "04", t: "Get orders in the kitchen", d: "Guests order from the table. Tickets appear on your kitchen screen the moment they tap Order." },
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-7xl scroll-mt-10 px-5 py-24 md:px-10 md:py-36">
      <div className="grid gap-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="eyebrow mb-5">How it works</p>
          <h2 className="text-4xl leading-[1.02] md:text-6xl">Live in four steps.</h2>
          <div className="mt-12 hidden gap-4 md:grid md:grid-cols-5">
            <img src={img("1556910103-1c02745aae4d", 700, 900)} alt="Chef plating in a kitchen" loading="lazy" className="col-span-3 aspect-[3/4] w-full rounded-xl object-cover" />
            <img src={img("1509440159596-0249088772ff", 400, 600)} alt="Fresh loaves" loading="lazy" className="col-span-2 mt-24 aspect-[2/3] w-full rounded-xl object-cover" />
          </div>
        </div>
        <ol className="md:col-span-6 md:col-start-7">
          {STEPS.map((s) => (
            <li key={s.n} className="group grid grid-cols-[3.5rem_1fr] gap-4 border-t border-hairline py-9 last:border-b md:grid-cols-[5rem_1fr]">
              <span className="font-display text-2xl text-highlight md:text-3xl">{s.n}</span>
              <div>
                <h3 className="text-2xl md:text-3xl">{s.t}</h3>
                <p className="mt-3 max-w-md text-muted-foreground">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
