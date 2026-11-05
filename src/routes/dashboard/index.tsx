import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/")({
  component: () => (
    <div>
      <p className="eyebrow">Overview</p>
      <h1 className="mt-3 text-5xl">Good morning. Coffee first.</h1>
    </div>
  ),
});
