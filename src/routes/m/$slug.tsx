import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { z } from "zod";
import { MenuView } from "@/components/landing/DemoMenu";
import { getPublicMenu } from "@/lib/menu/menu.functions";

export const Route = createFileRoute("/m/$slug")({
  validateSearch: z.object({ table: z.coerce.string().max(40).optional() }),
  loader: async ({ params }) => {
    const data = await getPublicMenu({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.restaurant.name} — Menu` : "Menu — Plated";
    const desc = loaderData?.restaurant.description ?? "Browse the menu and order from your table.";
    const image = loaderData?.restaurant.cover_url?.includes("https://") ? loaderData.restaurant.cover_url.split("?")[0] + "?w=1200&h=630&fit=crop&q=75&auto=format" : undefined;
    return {
      meta: [
        { title }, { name: "description", content: desc },
        { property: "og:title", content: title }, { property: "og:description", content: desc },
        { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-6 py-24">
      <h1 className="text-5xl">Hmm, no menu here.</h1>
      <p className="mt-3 text-muted-foreground">Check the link or scan the code on your table again.</p>
      <Link to="/" className="mt-8 inline-block underline underline-offset-4">Go to Plated</Link>
    </div>
  ),
  component: MenuPage,
});

function MenuPage() {
  const data = Route.useLoaderData();
  const { table } = Route.useSearch();
  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col border-x border-hairline">
      {table && <div className="border-b border-hairline px-4 py-2 text-center text-xs text-muted-foreground">Ordering for table {table}</div>}
      <div className="min-h-0 flex-1"><MenuView data={data} live /></div>
    </div>
  );
}
