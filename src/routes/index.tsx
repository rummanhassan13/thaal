import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/plated/primitives";
import { SiteFooter, SiteNav } from "@/components/landing/SiteNav";
import { MenuView, Phone } from "@/components/landing/DemoMenu";
import { getPublicMenu } from "@/lib/menu/menu.functions";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { OwnerSide } from "@/components/landing/OwnerSide";
import { Pricing } from "@/components/landing/Pricing";
import { img } from "@/lib/unsplash";
import { InstallBanner } from "@/components/plated/InstallBanner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Plated — Beautiful QR menus for independent restaurants" },
      { name: "description", content: "Build a photo menu, make it look like your place, print branded QR codes and take orders from the table." },
      { property: "og:title", content: "Plated — Your menu, but the good kind" },
      { property: "og:description", content: "Photo menus, branded QR codes and table ordering for cafés and restaurants." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => getPublicMenu({ data: { slug: "lemon-and-rye" } }),
  component: Landing,
});

function Landing() {
  const demo = Route.useLoaderData();
  return (
    <div className="overflow-x-clip">
      <InstallBanner />
      <SiteNav />
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pt-10 pb-20 md:grid-cols-12 md:px-10 md:pt-16 md:pb-32">
        <motion.div className="md:col-span-7" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 120, damping: 20 }}>
          <p className="eyebrow mb-8">Digital menus for independents</p>
          <h1 className="text-[3.4rem] leading-[0.95] sm:text-7xl lg:text-[7.2rem]">
            Your menu, but the <em>good</em> kind.
          </h1>
          <p className="mt-8 max-w-sm text-base text-muted-foreground">
            Photo menus your guests actually want to scroll. Scan, pick, order, pay. You get the table back.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link to="/signup" className={buttonVariants({ variant: "accent", size: "lg" })}>Start free</Link>
            <a href="#how" className={buttonVariants({ variant: "link" })}>See how it works</a>
          </div>
          <p className="mt-14 hidden max-w-xs border-t border-hairline pt-5 text-xs text-muted-foreground md:block">
            Try it — the phone on the right is a real menu. Tap a dish, add it to your order.
          </p>
        </motion.div>
        <motion.div className="relative md:col-span-5" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 90, damping: 18, delay: 0.1 }}>
          <img src={img("1504674900247-0877df9cc836", 700, 900)} alt="" aria-hidden loading="eager" className="absolute -top-8 -right-24 hidden h-[560px] w-[380px] rounded-xl object-cover opacity-90 lg:block" />
          <div className="relative"><Phone>{demo ? <MenuView data={demo} inPhone /> : <div className="h-full bg-secondary" />}</Phone></div>
        </motion.div>
      </section>

      <div className="mx-auto max-w-7xl px-5 md:px-10"><div className="h-px bg-hairline" /></div>
      <HowItWorks />
      <div className="bg-secondary/50"><OwnerSide /></div>
      <Pricing />

      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-10 md:pb-32">
        <div className="grid items-end gap-10 rounded-xl bg-ink p-8 text-paper md:grid-cols-12 md:p-16">
          <h2 className="text-5xl leading-[0.98] md:col-span-8 md:text-7xl">Hungry? <br />Start here.</h2>
          <div className="md:col-span-4">
            <p className="mb-6 text-sm text-paper/70">Your first menu is free. Takes about as long as a coffee.</p>
            <Link to="/signup" className={buttonVariants({ variant: "accent", size: "lg" })}>Build your menu</Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
