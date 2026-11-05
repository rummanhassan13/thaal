import { Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/thaal/Wordmark";
import { buttonVariants } from "@/components/thaal/primitives";

export function SiteNav() {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-10">
      <Wordmark />
      <nav className="flex items-center gap-6 text-sm">
        <a href="#how" className="hidden text-muted-foreground hover:text-foreground md:inline">How it works</a>
        <a href="#pricing" className="hidden text-muted-foreground hover:text-foreground md:inline">Pricing</a>
        <Link to="/login" className="text-muted-foreground hover:text-foreground">Log in</Link>
        <Link to="/signup" className={buttonVariants({ variant: "ink", size: "sm" })}>Start free</Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-7xl px-5 md:px-10">
      <div aria-hidden className="truck-border" />
      <div className="flex flex-col gap-6 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="flex items-baseline gap-4"><Wordmark className="text-xl text-foreground" /><span>Menus worth scanning.</span></div>
        <div className="flex gap-6">
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
          <Link to="/login" className="hover:text-foreground">Log in</Link>
          <span>© 2026</span>
        </div>
      </div>
    </footer>
  );
}
