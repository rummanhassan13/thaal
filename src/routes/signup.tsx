import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "@/components/plated/AuthCard";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [
    { title: "Start free — Plated" }, { name: "description", content: "Create your restaurant's photo menu and QR codes for free." },
    { property: "og:title", content: "Start free — Plated" }, { property: "og:description", content: "Create your restaurant's photo menu and QR codes for free." },
  ] }),
  component: () => <AuthCard mode="signup" />,
});
