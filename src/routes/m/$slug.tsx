import { createFileRoute, notFound, Link, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { CustomerMenu } from "@/components/menu/CustomerMenu";
import { getPublicMenu } from "@/lib/menu/menu.functions";
import { FONT_PAIRINGS } from "@/lib/menu/theme";

export const Route = createFileRoute("/m/$slug")({
  validateSearch: z.object({ table: z.coerce.string().optional() }),
  loaderDeps: ({ search }) => ({ table: search.table }),
  loader: async ({ params, deps }) => {
    const data = await getPublicMenu({ data: { slug: params.slug, table: deps.table?.slice(0, 64) } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.restaurant.name} — Menu` : "Menu — Thaal";
    const desc = loaderData?.restaurant.description ?? "Browse the menu and order from your table.";
    const cover = loaderData?.theme?.cover_url ?? loaderData?.restaurant.cover_url;
    const image = cover?.startsWith("https://") ? (cover.includes("unsplash") ? cover.split("?")[0] + "?w=1200&h=630&fit=crop&q=75&auto=format" : cover) : undefined;
    const font = loaderData?.theme ? FONT_PAIRINGS[loaderData.theme.font_pairing]?.href : null;
    return {
      meta: [
        { title }, { name: "description", content: desc },
        { property: "og:title", content: title }, { property: "og:description", content: desc },
        { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
        { name: "theme-color", content: loaderData?.theme?.mode === "dark" ? "#10162F" : "#F6F5F1" },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      ],
      links: [
        ...(font ? [{ rel: "stylesheet", href: font }] : []),
        ...(image ? [{ rel: "preload", as: "image", href: image.replace("w=1200&h=630", "w=900&h=675") }] : []),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-6 py-24">
      <h1 className="text-5xl">Hmm, no menu here.</h1>
      <p className="mt-3 text-muted-foreground">Check the link or scan the code on your table again.</p>
      <Link to="/" className="mt-8 inline-block underline underline-offset-4">Go to Thaal</Link>
    </div>
  ),
  errorComponent: MenuError,
  component: MenuPage,
});

function MenuError() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-md px-6 py-24">
      <h1 className="text-5xl">The menu dropped a plate.</h1>
      <p className="mt-3 text-muted-foreground">Probably a wobbly connection. Give it another go.</p>
      <button onClick={() => router.invalidate()} className="mt-8 underline underline-offset-4">Try again</button>
    </div>
  );
}

function MenuPage() {
  const data = Route.useLoaderData();
  const { table } = Route.useSearch();
  return <CustomerMenu data={data} table={table?.slice(0, 64)} />;
}
