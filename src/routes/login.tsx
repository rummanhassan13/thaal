import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "@/components/plated/AuthCard";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [
    { title: "Log in — Plated" }, { name: "description", content: "Log in to manage your Plated menu." },
    { property: "og:title", content: "Log in — Plated" }, { property: "og:description", content: "Log in to manage your Plated menu." },
  ] }),
  component: () => <AuthCard mode="login" />,
});
