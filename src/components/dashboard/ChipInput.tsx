import { useState } from "react";
import { cn } from "@/lib/utils";

export function ChipInput({ label, value, onChange, placeholder, quickPicks }: {
  label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string; quickPicks?: string[];
}) {
  const [text, setText] = useState("");
  const has = (s: string) => value.some((v) => v.toLowerCase() === s.toLowerCase());
  const add = (raw: string) => {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean).filter((s) => !has(s));
    if (parts.length) onChange([...value, ...parts]);
    setText("");
  };
  const toggle = (s: string) => onChange(has(s) ? value.filter((v) => v.toLowerCase() !== s.toLowerCase()) : [...value, s]);
  return (
    <div>
      <span className="mb-1.5 block text-xs text-muted-foreground">{label}</span>
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-card px-2 py-1.5 focus-within:border-ink">
        {value.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-0.5 text-xs">
            {v}
            <button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(value.filter((x) => x !== v))} className="text-muted-foreground hover:text-foreground">×</button>
          </span>
        ))}
        <input
          value={text} placeholder={value.length ? "" : placeholder} aria-label={label}
          onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setText(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); add(text); }
            if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={() => text && add(text)}
          className="h-7 min-w-[6rem] flex-1 bg-transparent px-1 text-sm focus:outline-none"
        />
      </div>
      {quickPicks && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {quickPicks.map((q) => (
            <button key={q} type="button" onClick={() => toggle(q)} aria-pressed={has(q)}
              className={cn("rounded-full border px-2.5 py-0.5 text-xs capitalize transition-colors", has(q) ? "border-ink bg-ink text-paper" : "border-hairline text-muted-foreground hover:text-foreground")}>
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
