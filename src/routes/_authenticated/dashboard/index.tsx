import { createFileRoute, Link } from "@tanstack/react-router";
import { buttonVariants } from "@/components/plated/primitives";

export const Route = createFileRoute("/_authenticated/dashboard/")({ component: Overview });

function Overview() {
  const { restaurant } = Route.useRouteContext();
  return (
    <div className="max-w-2xl">
      <p className="eyebrow">Overview</p>
      <h1 className="mt-3 text-5xl leading-none">Good to see you.</h1>
      <p className="mt-4 text-muted-foreground">
        {restaurant.name} is {restaurant.published ? "live" : "not published yet"}. You're on the {restaurant.plan} plan.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-6">
        <Link to="/m/$slug" params={{ slug: restaurant.slug }} className={buttonVariants({ variant: "outline" })}>View your menu</Link>
        <Link to="/dashboard/menu" className={buttonVariants({ variant: "link" })}>Add dishes</Link>
      </div>
    </div>
  );
}
