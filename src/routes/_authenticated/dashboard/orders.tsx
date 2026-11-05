import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/orders")({
  component: () => (
    <div>
      <p className="eyebrow">Orders</p>
      <h1 className="mt-3 text-5xl">No orders yet. Quiet before the rush.</h1>
    </div>
  ),
});
