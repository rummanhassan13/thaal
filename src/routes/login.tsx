import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AuthCard } from "@/components/plated/AuthCard";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [
    { title: "Log in — Plated" }, { name: "description", content: "Log in to manage your Plated menu." },
    { property: "og:title", content: "Log in — Plated" }, { property: "og:description", content: "Log in to manage your Plated menu." },
  ] }),
  validateSearch: z.object({ redirect: z.string().optional() }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  return <AuthCard mode="login" redirectTo={redirect} />;
}
