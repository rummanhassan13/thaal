import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/design")({
  component: () => (
    <div>
      <p className="eyebrow">Design</p>
      <h1 className="mt-3 text-5xl">Colours, type and QR codes, coming soon.</h1>
    </div>
  ),
});
