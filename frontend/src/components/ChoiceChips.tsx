"use client";

import { useRef } from "react";
import { FieldError } from "@/components/ui";

type Option<T> = { value: T; label: string; hint?: string };

/** Single-choice pills (a radio group). Arrow keys move between options. */
export function ChoiceChips<T extends string | number | boolean>({
  id,
  label,
  options,
  value,
  onChange,
  error,
  columns,
}: {
  id: string;
  label: string;
  options: readonly Option<T>[];
  value: T | undefined;
  onChange: (v: T) => void;
  error?: string;
  columns?: number;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = options.findIndex((o) => o.value === value);
  const hint = options[selectedIndex]?.hint;

  function onKeyDown(e: React.KeyboardEvent, i: number) {
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? i + 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? i - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const j = (next + options.length) % options.length;
    onChange(options[j].value);
    refs.current[j]?.focus();
  }

  return (
    <div className="flex flex-col gap-2" data-field={id}>
      <p id={`${id}-label`} className="text-sm font-medium text-body">
        {label}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}
      >
        {options.map((o, i) => {
          const selected = o.value === value;
          return (
            <button
              key={String(o.value)}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected || (selectedIndex === -1 && i === 0) ? 0 : -1}
              onClick={() => onChange(o.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`min-h-12 rounded-full border-2 px-3 py-2 text-sm font-medium transition-all focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mint-dark sm:text-base ${
                selected
                  ? "border-mint bg-mint font-bold text-ink"
                  : error
                    ? "border-warning bg-warning/5 text-ink hover:border-mint"
                    : "border-line bg-white text-ink hover:border-mint"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {hint && <p className="animate-fade-in text-sm text-muted">{hint}</p>}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}
