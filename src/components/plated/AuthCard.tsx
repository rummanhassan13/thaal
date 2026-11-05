import { Link } from "@tanstack/react-router";
import { Wordmark } from "./Wordmark";
import { Button, Input } from "./primitives";
import { img } from "@/lib/unsplash";

export function AuthCard({ mode }: { mode: "login" | "signup" }) {
  const signup = mode === "signup";
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="flex flex-col px-6 py-6 md:px-14">
        <Wordmark />
        <div className="my-auto w-full max-w-sm py-16">
          <h1 className="text-5xl leading-none">{signup ? "Pull up a chair." : "Welcome back."}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{signup ? "Your first menu is on us." : "The kitchen missed you."}</p>
          <form className="mt-10 space-y-4" onSubmit={(e) => e.preventDefault()}>
            {signup && <Input label="Restaurant name" placeholder="Lemon & Rye" />}
            <Input label="Email" type="email" placeholder="you@restaurant.com" />
            <Input label="Password" type="password" placeholder="••••••••" />
            <Button variant="ink" className="w-full" type="submit">{signup ? "Create account" : "Log in"}</Button>
          </form>
          <p className="mt-6 text-sm text-muted-foreground">
            {signup ? "Already cooking with us? " : "New here? "}
            <Link to={signup ? "/login" : "/signup"} className="text-foreground underline underline-offset-4">{signup ? "Log in" : "Start free"}</Link>
          </p>
        </div>
      </div>
      <img src={img(signup ? "1517248135467-4c7edcad34c4" : "1414235077428-338989a2e8c0", 1000, 1300)} alt="" className="hidden h-screen w-full object-cover md:block" />
    </div>
  );
}
