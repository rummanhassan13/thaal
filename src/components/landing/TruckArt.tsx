import { useId, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

/* Original truck-art motifs for the landing page only. Decorative: aria-hidden, no pointer events. */

const deco = "pointer-events-none select-none";

/** Fade-up on scroll, once. Reduced motion: shown immediately, no movement. */
export function Reveal({ delay = 0, y = 16, className, children, ...rest }: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Very slight scroll drift/rotation wrapper for motifs. */
export function Drift({ className, range = 24, rotate = 6, children }: { className?: string; range?: number; rotate?: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [range, -range]);
  const r = useTransform(scrollYProgress, [0, 1], [-rotate, rotate]);
  return (
    <motion.div ref={ref} aria-hidden className={cn(deco, "will-change-transform", className)} style={reduce ? undefined : { y, rotate: r }}>
      {children}
    </motion.div>
  );
}

/** Phool: 8-petal rosette with inner ring. */
export function Rosette({ className }: { className?: string }) {
  const petals = Array.from({ length: 8 }, (_, i) => i * 45);
  const small = Array.from({ length: 16 }, (_, i) => i * 22.5);
  return (
    <svg viewBox="0 0 200 200" aria-hidden className={cn(deco, className)}>
      {small.map((a) => <circle key={a} cx="100" cy="12" r="4" fill="var(--teal)" transform={`rotate(${a} 100 100)`} />)}
      <circle cx="100" cy="100" r="78" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
      {petals.map((a) => (
        <path key={a} d="M100 100 C 82 76, 86 40, 100 26 C 114 40, 118 76, 100 100 Z" fill="var(--marigold)" stroke="var(--ink)" strokeWidth="1.5" transform={`rotate(${a} 100 100)`} />
      ))}
      {petals.map((a) => (
        <path key={`p${a}`} d="M100 100 C 93 84, 94 66, 100 58 C 106 66, 107 84, 100 100 Z" fill="var(--pink)" transform={`rotate(${a + 22.5} 100 100)`} />
      ))}
      <circle cx="100" cy="100" r="16" fill="var(--ink)" />
      <circle cx="100" cy="100" r="7" fill="var(--marigold)" />
    </svg>
  );
}

/** Paisley-ish leaf. */
export function Paisley({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 180" aria-hidden className={cn(deco, className)}>
      <path d="M60 170 C 10 150, 8 80, 40 50 C 60 30, 98 30, 104 62 C 110 92, 80 104, 70 88 C 62 76, 76 64, 84 70" fill="var(--teal)" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
      <path d="M58 150 C 28 134, 28 88, 50 68 C 64 56, 86 58, 88 72" fill="none" stroke="var(--marigold)" strokeWidth="3" strokeLinecap="round" />
      {[0, 1, 2, 3].map((i) => <circle key={i} cx={46 + i * 3} cy={130 - i * 18} r="4" fill="var(--pink)" />)}
    </svg>
  );
}

/** Simple peacock/bird silhouette. */
export function Bird({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" aria-hidden className={cn(deco, className)}>
      <path d="M40 92 C 30 70, 44 46, 70 46 C 78 30, 92 22, 100 28 L 112 26 L 102 34 C 104 50, 96 66, 84 74 C 108 76, 136 70, 152 56 C 140 84, 108 100, 72 100 C 58 100, 46 98, 40 92 Z" fill="var(--ink)" />
      <circle cx="98" cy="32" r="2.5" fill="var(--marigold)" />
      <path d="M96 22 l-2 -10 M100 22 l2 -11 M104 24 l6 -8" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
      {[0, 1, 2].map((i) => <circle key={i} cx={110 + i * 14} cy={80 - i * 6} r="4" fill="var(--marigold)" />)}
      <path d="M60 100 l-4 14 M74 100 l2 14" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Repeating geometric tile pattern (fills its box). Control strength with opacity on className. */
export function TilePattern({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg aria-hidden className={cn(deco, className)} width="100%" height="100%">
      <defs>
        <pattern id={`tile-${id}`} width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M24 4 L44 24 L24 44 L4 24 Z" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
          <path d="M24 14 C 28 20, 28 28, 24 34 C 20 28, 20 20, 24 14 Z" fill="var(--marigold)" />
          <circle cx="0" cy="0" r="4" fill="var(--pink)" /><circle cx="48" cy="0" r="4" fill="var(--pink)" />
          <circle cx="0" cy="48" r="4" fill="var(--pink)" /><circle cx="48" cy="48" r="4" fill="var(--pink)" />
          <circle cx="24" cy="24" r="1.6" fill="var(--teal)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#tile-${id})`} />
    </svg>
  );
}

/** Coloured chamak-patti strip: diamonds + scallops between two rules. */
export function ChamakPatti({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  const id = useId().replace(/:/g, "");
  const line = onDark ? "var(--marigold)" : "var(--ink)";
  return (
    <svg aria-hidden className={cn(deco, "block h-6 w-full", className)} preserveAspectRatio="none">
      <defs>
        <pattern id={`cp-${id}`} width="40" height="24" patternUnits="userSpaceOnUse">
          <path d="M0 6 Q5 0 10 6 Q15 0 20 6 Q25 0 30 6 Q35 0 40 6" fill="none" stroke="var(--teal)" strokeWidth="1.2" />
          <path d="M0 18 Q5 24 10 18 Q15 24 20 18 Q25 24 30 18 Q35 24 40 18" fill="none" stroke="var(--teal)" strokeWidth="1.2" />
          <path d="M20 6 L26 12 L20 18 L14 12 Z" fill="var(--marigold)" stroke={line} strokeWidth="1" />
          <circle cx="20" cy="12" r="1.6" fill={line} />
          <path d="M0 9 L3 12 L0 15 Z M40 9 L37 12 L40 15 Z" fill="var(--pink)" />
        </pattern>
      </defs>
      <rect width="100%" height="24" fill={`url(#cp-${id})`} />
    </svg>
  );
}
