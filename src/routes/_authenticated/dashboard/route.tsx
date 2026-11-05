import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { Wordmark } from "@/components/plated/Wordmark";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyRestaurant } from "@/lib/restaurant";

const NAV = [
  { to: "/dashboard", label: "Overview" },
  { to: "/dashboard/menu", label: "Menu" },
  { to: "/dashboard/orders", label: "Orders" },
  { to: "/dashboard/design", label: "Design" },
] as const;

export const Route = createFileRoute("/_authenticated/dashboard")({
  beforeLoad: async ({ context }) => {
    const restaurant = await fetchMyRestaurant(context.user.id);
    if (!restaurant) throw redirect({ to: "/onboarding" });
    return { restaurant };
  },
  head: () => ({ meta: [
    { title: "Dashboard — Plated" }, { name: "description", content: "Manage your menu, orders and design." },
    { property: "og:title", content: "Dashboard — Plated" }, { property: "og:description", content: "Manage your menu, orders and design." },
  ] }),
  component: DashboardLayout,
});

function DashboardLayout() {
  const { restaurant, queryClient } = Route.useRouteContext();
  const navigate = useNavigate();
  const router = useRouter();
  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await router.invalidate();
    navigate({ to: "/login", replace: true });
  };
  return (
    <div className="min-h-screen md:grid md:grid-cols-[220px_1fr]">
      <aside className="flex flex-col border-b border-hairline px-5 py-5 md:border-r md:border-b-0">
        <Wordmark />
        <p className="mt-6 truncate text-sm md:mt-10">{restaurant.name}</p>
        <nav className="mt-4 flex gap-4 text-sm md:flex-col md:gap-1">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: true }} className="rounded-md py-1.5 text-muted-foreground hover:text-foreground md:px-3" activeProps={{ className: "text-foreground md:bg-secondary" }}>{n.label}</Link>
          ))}
        </nav>
        <button onClick={signOut} className="mt-6 text-left text-sm text-muted-foreground hover:text-foreground md:mt-auto">Sign out</button>
      </aside>
      <main className="px-5 py-10 md:px-12"><Outlet /></main>
    </div>
  );
}
