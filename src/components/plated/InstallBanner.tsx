import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BottomSheet, Button } from "@/components/plated/primitives";
import { DISMISS_KEY, dismissedRecently, isIosSafari } from "@/lib/install-prompt";
import { cn } from "@/lib/utils";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

/** "Add Plated to your home screen" for phones. Not mounted on diner menus. */
export function InstallBanner({ className }: { className?: string }) {
  const [mode, setMode] = useState<"android" | "ios" | null>(null);
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [howTo, setHowTo] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
    const phone = window.matchMedia("(max-width: 767px)").matches;
    const stored = Number(localStorage.getItem(DISMISS_KEY)) || null;
    if (standalone || !phone || dismissedRecently(stored)) return;
    if (isIosSafari(navigator.userAgent)) { setMode("ios"); return; }
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); setMode("android"); };
    const onInstalled = () => setMode(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  const dismiss = () => { localStorage.setItem(DISMISS_KEY, String(Date.now())); setMode(null); setHowTo(false); };
  const install = async () => {
    if (mode === "ios") return setHowTo(true);
    if (!evt) return;
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    setEvt(null);
    if (outcome === "accepted") setMode(null); else dismiss();
  };

  return (
    <>
      <AnimatePresence>
        {mode && !howTo && (
          <motion.div
            role="region" aria-label="Install Plated"
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 34, delay: 0.6 }}
            className={cn("fixed inset-x-3 bottom-3 z-40 flex items-center gap-3 rounded-xl border border-hairline bg-background p-3 pl-3.5 md:hidden", className)}
          >
            <img src="/icon-192.png" alt="" width={40} height={40} className="h-10 w-10 rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight">Add Plated to your home screen</p>
              <p className="text-xs text-muted-foreground">Opens like an app. One tap to your orders.</p>
            </div>
            <Button size="sm" variant="ink" onClick={install}>Install</Button>
            <button type="button" onClick={dismiss} aria-label="Not now" className="-mr-1 px-1.5 py-1 text-lg leading-none text-muted-foreground">×</button>
          </motion.div>
        )}
      </AnimatePresence>
      <BottomSheet open={howTo} onClose={() => setHowTo(false)} label="Add to Home Screen">
        <p className="eyebrow">On iPhone</p>
        <h2 className="mt-2 text-3xl">Two taps and it's there.</h2>
        <ol className="mt-6">
          {[
            ["01", <>Tap <strong className="font-medium">Share</strong> — the square with an arrow, at the bottom of Safari.</>],
            ["02", <>Scroll and choose <strong className="font-medium">Add to Home Screen</strong>.</>],
            ["03", <>Tap <strong className="font-medium">Add</strong>. Plated now lives next to your other apps.</>],
          ].map(([n, t]) => (
            <li key={n as string} className="flex gap-4 border-t border-hairline py-4 text-[15px] last:border-b">
              <span className="font-display text-xl text-highlight">{n}</span><span>{t}</span>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex items-center justify-between">
          <button type="button" onClick={dismiss} className="text-sm text-muted-foreground">Don't remind me</button>
          <Button variant="ink" onClick={() => setHowTo(false)}>Got it</Button>
        </div>
      </BottomSheet>
    </>
  );
}
