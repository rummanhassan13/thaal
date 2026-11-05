import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { DemoMenu } from "@/components/landing/DemoMenu";

export const Route = createFileRoute("/m/$slug")({
  validateSearch: z.object({ table: z.coerce.number().int().positive().optional() }),
  head: ({ params }) => ({ meta: [
    { title: `${params.slug} menu — Plated` }, { name: "description", content: "Browse the menu and order from your table." },
    { property: "og:title", content: `${params.slug} menu — Plated` }, { property: "og:description", content: "Browse the menu and order from your table." },
  ] }),
  component: MenuPage,
});

function MenuPage() {
  const { table } = Route.useSearch();
  return (
    <div className="mx-auto h-dvh max-w-md border-x border-hairline">
      {table && <div className="border-b border-hairline px-4 py-2 text-center text-xs text-muted-foreground">Ordering for table {table}</div>}
      <div className={table ? "h-[calc(100dvh-33px)]" : "h-full"}><DemoMenu /></div>
    </div>
  );
}
