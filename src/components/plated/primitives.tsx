import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        ink: "bg-ink text-paper hover:bg-ink/85 rounded-lg",
        accent: "bg-terracotta text-accent-foreground hover:bg-terracotta/90 rounded-lg",
        ghost: "text-foreground hover:bg-sand rounded-lg",
        outline: "border border-ink/20 text-foreground hover:border-ink rounded-lg",
        link: "text-foreground underline decoration-1 underline-offset-[6px] decoration-ink/30 hover:decoration-terracotta px-0",
      },
      size: { sm: "h-9 px-4", md: "h-11 px-5", lg: "h-13 px-7 text-[15px]" },
    },
    compoundVariants: [{ variant: "link", class: "px-0 h-auto" }],
    defaultVariants: { variant: "ink", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

/** Pill group with a gliding active indicator (layoutId). */
export function PillGroup<T extends string>({
  items, value, onChange, id = "pill", className, size = "md",
}: {
  items: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  id?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className={cn("flex gap-1", className)}>
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            onClick={() => onChange(it.value)}
            className={cn(
              "relative shrink-0 rounded-full transition-colors",
              size === "sm" ? "px-3 py-1 text-[11px]" : "px-4 py-1.5 text-sm",
              active ? "text-paper" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={id}
                className="absolute inset-0 rounded-full bg-ink"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Pill({ className, ...p }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex items-center rounded-full border border-hairline px-3 py-1 text-xs", className)} {...p} />;
}

const tagStyles = {
  veg: "text-olive border-olive/40",
  spicy: "text-terracotta border-terracotta/40",
  neutral: "text-muted-foreground border-hairline",
  soldout: "bg-ink text-paper border-ink",
};
export function Tag({ kind = "neutral", className, children }: { kind?: keyof typeof tagStyles; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-[1px] text-[10px] font-medium uppercase tracking-wider", tagStyles[kind], className)}>
      {children}
    </span>
  );
}

export function Divider({ className, vertical }: { className?: string; vertical?: boolean }) {
  return <div role="separator" className={cn(vertical ? "w-px self-stretch bg-hairline" : "h-px w-full bg-hairline", className)} />;
}

export function SectionHeading({ eyebrow, title, children, className }: { eyebrow?: string; title: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow && <p className="eyebrow mb-5">{eyebrow}</p>}
      <h2 className="text-4xl leading-[1.02] md:text-6xl">{title}</h2>
      {children && <p className="mt-5 max-w-md text-muted-foreground">{children}</p>}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label?: string }>(
  ({ className, label, id, ...props }, ref) => {
    const auto = React.useId();
    const inputId = id ?? auto;
    return (
      <label htmlFor={inputId} className="block">
        {label && <span className="mb-1.5 block text-xs text-muted-foreground">{label}</span>}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-11 w-full rounded-lg border border-input bg-card px-3.5 text-sm placeholder:text-muted-foreground/70 focus:border-ink focus:outline-none",
            className,
          )}
          {...props}
        />
      </label>
    );
  },
);
Input.displayName = "Input";

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-6 w-10 rounded-full transition-colors", checked ? "bg-terracotta" : "bg-sand-deep")}
    >
      <motion.span
        className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-paper"
        animate={{ x: checked ? 16 : 0 }}
        transition={{ type: "spring", stiffness: 600, damping: 35 }}
      />
    </button>
  );
}

/** Spring bottom sheet; drag the handle down to dismiss. `contained` positions it inside a relative parent (e.g. phone mockup). */
export function BottomSheet({ open, onClose, children, contained, label, className }: {
  open: boolean; onClose: () => void; children: React.ReactNode; contained?: boolean; label?: string | undefined; className?: string;
}) {
  const pos = contained ? "absolute" : "fixed";
  const controls = useDragControls();
  React.useEffect(() => {
    if (!open || contained) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open, contained, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={cn(pos, "inset-0 z-40 bg-ink/40")}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog" aria-modal="true" aria-label={label}
            className={cn(pos, "inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] max-w-md flex-col rounded-t-xl bg-background text-foreground", className)}
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            drag="y" dragListener={false} dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => (i.offset.y > 80 || i.velocity.y > 500) && onClose()}
          >
            <div onPointerDown={(e) => controls.start(e)} className="flex shrink-0 cursor-grab touch-none justify-center pt-3 pb-3">
              <div className="h-1 w-9 rounded-full bg-sand-deep" />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-7">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
