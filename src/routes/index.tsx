import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/thaal/primitives";
import { SiteFooter, SiteNav } from "@/components/landing/SiteNav";
import { MenuView, Phone } from "@/components/landing/DemoMenu";
import { getPublicMenu } from "@/lib/menu/menu.functions";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { OwnerSide } from "@/components/landing/OwnerSide";
import { Pricing } from "@/components/landing/Pricing";
import { img } from "@/lib/unsplash";
import { InstallBanner } from "@/components/thaal/InstallBanner";
import { getRequestOrigin } from "@/lib/origin.functions";

export const Route = createFileRoute("/")({
  head: ({ loaderData }) => {
    const title = "Thaal — QR menus and table ordering for restaurants";
    const desc = "Guests scan, see every dish with photos and order from their phone. Orders land in your kitchen instantly. Free plan, set up in 10 minutes.";
    const image = loaderData?.origin ? `${loaderData.origin}/og-image.jpg` : null;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      ],
    };
  },
  loader: async () => {
    const [demo, origin] = await Promise.all([getPublicMenu({ data: { slug: "lemon-and-rye" } }), getRequestOrigin().catch(() => null)]);
    return { demo, origin };
  },
  component: Landing,
});

function Landing() {
  const { demo } = Route.useLoaderData();
  return (
    <div className="overflow-x-clip">
      <InstallBanner />
      <SiteNav />
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pt-10 pb-20 md:grid-cols-12 md:px-10 md:pt-16 md:pb-32">
        <motion.div className="md:col-span-7" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 120, damping: 20 }}>
          <p className="eyebrow mb-8">For restaurants, cafés and dhabas</p>
          <h1 className="text-[2.9rem] leading-[0.98] sm:text-6xl lg:text-[5.6rem]">
            QR menus and table ordering for <em>restaurants.</em>
          </h1>
          <p className="mt-8 max-w-md text-base text-muted-foreground md:text-lg">
            Guests scan, see every dish with photos and order from their phone. Orders land in your kitchen instantly, with no waiting for a waiter and no reprinting menus.
          </p>
          <div className="mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-6">
            <Link to="/signup" className={buttonVariants({ variant: "accent", size: "lg" })}>Create your menu free</Link>
            <Link to="/m/$slug" params={{ slug: "lemon-and-rye" }} search={{ table: "4" }} className={buttonVariants({ variant: "link" })}>See a live menu</Link>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">Set up in 10 minutes. Free plan, no card needed.</p>
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
          <h2 className="text-5xl leading-[0.98] md:col-span-8 md:text-7xl">Your menu online <br />by tonight.</h2>
          <div className="md:col-span-4">
            <p className="mb-6 text-sm text-paper/70">Add your dishes, print your QR codes and start taking orders. The Free plan costs nothing, forever.</p>
            <Link to="/signup" className={buttonVariants({ variant: "accent", size: "lg" })}>Create your menu free</Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
