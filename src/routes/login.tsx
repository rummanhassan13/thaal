import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AuthCard } from "@/components/thaal/AuthCard";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [
    { title: "Log in — Thaal" }, { name: "description", content: "Log in to manage your Thaal menu." },
    { property: "og:title", content: "Log in — Thaal" }, { property: "og:description", content: "Log in to manage your Thaal menu." },
  ] }),
  validateSearch: z.object({ redirect: z.string().optional() }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  return <AuthCard mode="login" redirectTo={redirect} />;
}
