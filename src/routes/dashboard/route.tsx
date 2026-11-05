import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Wordmark } from "@/components/plated/Wordmark";

const NAV = [
  { to: "/dashboard", label: "Overview" },
  { to: "/dashboard/menu", label: "Menu" },
  { to: "/dashboard/orders", label: "Orders" },
  { to: "/dashboard/design", label: "Design" },
] as const;

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [
    { title: "Dashboard — Plated" }, { name: "description", content: "Manage your menu, orders and design." },
    { property: "og:title", content: "Dashboard — Plated" }, { property: "og:description", content: "Manage your menu, orders and design." },
  ] }),
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[220px_1fr]">
      <aside className="border-b border-hairline px-5 py-5 md:border-r md:border-b-0">
        <Wordmark />
        <nav className="mt-6 flex gap-4 text-sm md:mt-10 md:flex-col md:gap-1">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: true }} className="rounded-md py-1.5 text-muted-foreground md:px-3 hover:text-foreground" activeProps={{ className: "text-foreground md:bg-secondary" }}>{n.label}</Link>
          ))}
        </nav>
      </aside>
      <main className="px-5 py-10 md:px-12"><Outlet /></main>
    </div>
  );
}
