import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "@/components/thaal/AuthCard";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [
    { title: "Start free — Thaal" }, { name: "description", content: "Create your restaurant's photo menu and QR codes for free." },
    { property: "og:title", content: "Start free — Thaal" }, { property: "og:description", content: "Create your restaurant's photo menu and QR codes for free." },
  ] }),
  component: () => <AuthCard mode="signup" />,
});
