import { createFileRoute, Link, Outlet, redirect, useLocation, useNavigate, useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Wordmark } from "@/components/plated/Wordmark";
import { BranchProvider, useBranch } from "@/components/dashboard/BranchContext";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyRestaurant } from "@/lib/restaurant";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Overview", mobile: true },
  { to: "/dashboard/menu", label: "Menu", mobile: true },
  { to: "/dashboard/orders", label: "Orders", mobile: true },
  { to: "/dashboard/branches", label: "Branches", mobile: true },
  { to: "/dashboard/profile", label: "Profile", mobile: true },
  { to: "/dashboard/design", label: "Design", mobile: false },
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

function BranchSwitcher() {
  const { branches, branch, setBranchId } = useBranch();
  if (branches.length < 2) return branch ? <span className="truncate text-xs text-muted-foreground">{branch.name}</span> : null;
  return (
    <label className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
      <span className="hidden sm:inline">Branch</span>
      <select
        aria-label="Branch"
        value={branch?.id ?? ""}
        onChange={(e) => setBranchId(e.target.value)}
        className="h-8 max-w-[11rem] truncate rounded-md border border-hairline bg-card px-2 text-sm text-foreground focus:border-ink focus:outline-none"
      >
        {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
    </label>
  );
}

function DashboardLayout() {
  const { restaurant, queryClient } = Route.useRouteContext();
  const navigate = useNavigate();
  const router = useRouter();
  const { pathname } = useLocation();
  const isActive = (to: string) => (to === "/dashboard" ? pathname === "/dashboard" || pathname === "/dashboard/" : pathname.startsWith(to));
  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await router.invalidate();
    navigate({ to: "/login", replace: true });
  };
  return (
    <BranchProvider restaurantId={restaurant.id}>
      <div className="min-h-screen md:grid md:grid-cols-[232px_1fr]">
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-hairline px-5 py-6 md:flex">
          <Wordmark />
          <p className="mt-10 truncate font-display text-lg">{restaurant.name}</p>
          <nav className="mt-6 flex flex-col gap-0.5 text-sm">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className={cn("relative rounded-md px-3 py-2 transition-colors", isActive(n.to) ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {isActive(n.to) && <motion.span layoutId="side-nav" className="absolute inset-0 rounded-md bg-secondary" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                <span className="relative">{n.label}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-auto space-y-3 text-sm">
            <Link to="/m/$slug" params={{ slug: restaurant.slug }} target="_blank" className="block text-muted-foreground hover:text-foreground">View your menu ↗</Link>
            <button onClick={signOut} className="text-muted-foreground hover:text-foreground">Sign out</button>
          </div>
        </aside>

        <div className="min-w-0 pb-24 md:pb-0">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-hairline bg-background/95 px-5 backdrop-blur-sm md:px-12">
            <div className="flex min-w-0 items-center gap-3 md:hidden">
              <Wordmark className="text-xl" />
            </div>
            <div className="hidden min-w-0 md:block"><BranchSwitcher /></div>
            <div className="flex min-w-0 items-center gap-4">
              <div className="md:hidden"><BranchSwitcher /></div>
              <button onClick={signOut} className="text-xs text-muted-foreground hover:text-foreground md:hidden">Sign out</button>
            </div>
          </header>
          <main className="px-5 py-8 md:px-12 md:py-12"><Outlet /></main>
        </div>

        <nav aria-label="Dashboard" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-hairline bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
          {NAV.filter((n) => n.mobile).map((n) => (
            <Link key={n.to} to={n.to} className={cn("relative py-3.5 text-center text-[12px]", isActive(n.to) ? "text-foreground" : "text-muted-foreground")}>
              {isActive(n.to) && <motion.span layoutId="tab-nav" className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-terracotta" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </BranchProvider>
  );
}
