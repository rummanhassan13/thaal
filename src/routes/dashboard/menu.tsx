import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/menu")({
  component: () => (
    <div>
      <p className="eyebrow">Menu</p>
      <h1 className="mt-3 text-5xl">Your dishes will live here.</h1>
    </div>
  ),
});
