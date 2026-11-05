import { useEffect, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { Wordmark } from "./Wordmark";
import { Button, Input } from "./primitives";
import { img } from "@/lib/unsplash";
import { supabase } from "@/integrations/supabase/client";

export function AuthCard({ mode, redirectTo }: { mode: "login" | "signup"; redirectTo?: string | undefined }) {
  const signup = mode === "signup";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [magic, setMagic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<null | "confirm" | "magic">(null);

  const goOn = () => {
    const safe = redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/dashboard";
    router.history.push(safe);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) goOn(); });
    const { data: sub } = supabase.auth.onAuthStateChange((e) => { if (e === "SIGNED_IN") goOn(); });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const back = `${window.location.origin}/login`;
    try {
      if (signup) {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: back, data: { full_name: fullName } } });
        if (error) throw error;
        if (!data.session) setSent("confirm");
      } else if (magic) {
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: back, shouldCreateUser: false } });
        if (error) throw error;
        setSent("magic");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again?");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="flex flex-col px-6 py-6 md:px-14">
        <Wordmark />
        <div className="my-auto w-full max-w-sm py-16">
          {sent ? (
            <>
              <h1 className="text-5xl leading-none">Check your inbox.</h1>
              <p className="mt-4 text-sm text-muted-foreground">
                We sent a {sent === "confirm" ? "confirmation" : "sign-in"} link to <span className="text-foreground">{email}</span>. Tap it and you're in.
              </p>
              <button onClick={() => setSent(null)} className="mt-8 text-sm underline underline-offset-4">Use a different email</button>
            </>
          ) : (
            <>
              <h1 className="text-5xl leading-none">{signup ? "Pull up a chair." : "Welcome back."}</h1>
              <p className="mt-3 text-sm text-muted-foreground">{signup ? "Your first menu is on us." : "The kitchen missed you."}</p>
              <form className="mt-10 space-y-4" onSubmit={submit}>
                {signup && <Input label="Your name" placeholder="Sam Baker" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />}
                <Input label="Email" type="email" placeholder="you@restaurant.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                {!magic && (
                  <Input label="Password" type="password" placeholder={signup ? "At least 8 characters" : "••••••••"} minLength={signup ? 8 : undefined}
                    value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={signup ? "new-password" : "current-password"} />
                )}
                {error && <p className="text-sm text-alert">{error}</p>}
                <Button variant="ink" className="w-full" type="submit" disabled={busy}>
                  {busy ? "One moment…" : signup ? "Create account" : magic ? "Email me a link" : "Log in"}
                </Button>
              </form>
              {!signup && (
                <button onClick={() => setMagic((m) => !m)} className="mt-4 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                  {magic ? "Use a password instead" : "Email me a sign-in link instead"}
                </button>
              )}
              <p className="mt-6 text-sm text-muted-foreground">
                {signup ? "Already cooking with us? " : "New here? "}
                <Link to={signup ? "/login" : "/signup"} className="text-foreground underline underline-offset-4">{signup ? "Log in" : "Start free"}</Link>
              </p>
            </>
          )}
        </div>
      </div>
      <img src={img(signup ? "1517248135467-4c7edcad34c4" : "1414235077428-338989a2e8c0", 1000, 1300)} alt="" className="hidden h-screen w-full object-cover md:block" />
    </div>
  );
}
