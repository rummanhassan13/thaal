import { Link } from "@tanstack/react-router";
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`font-display text-2xl tracking-tight ${className}`}>
      Plated<span className="text-terracotta">.</span>
    </Link>
  );
}
