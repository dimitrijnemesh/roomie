"use client";

import { useId, useMemo, useRef, useState } from "react";
import { FieldError, inputClass } from "@/components/ui";
import { normalize } from "@/lib/academics";

export type ComboOption = { value: string; label: string; hint?: string; keywords?: string };

/**
 * Searchable select (ARIA combobox): type to filter, ↑/↓ to move, Enter to choose, Esc to close.
 * With `allowCustom`, text that matches nothing can be used as-is.
 */
export function Combobox({
  id,
  label,
  optional,
  placeholder,
  options,
  value,
  onChange,
  error,
  disabled,
  allowCustom,
  emptyText = "Нічого не знайшли — спробуй інше слово",
}: {
  id: string;
  label: string;
  optional?: boolean;
  placeholder?: string;
  options: ComboOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  allowCustom?: boolean;
  emptyText?: string;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<string | null>(null); // null = not typing, show the chosen value
  const [active, setActive] = useState(0);

  const selected = options.find((o) => o.value === value);
  const shown = query ?? selected?.label ?? value;

  const results = useMemo(() => {
    const words = normalize(query ?? "").split(" ").filter(Boolean);
    if (!words.length) return options;
    // Rank: name starts with the query → name contains it → only extra keywords match.
    const rank = (o: ComboOption) => {
      const name = normalize(`${o.label} ${o.hint ?? ""}`);
      if (words.every((w) => name.includes(w))) return name.startsWith(words[0]) || name.includes(` ${words[0]}`) ? 0 : 1;
      return words.every((w) => normalize(`${name} ${o.keywords ?? ""}`).includes(w)) ? 2 : -1;
    };
    return options
      .map((o, i) => ({ o, r: rank(o), i }))
      .filter((x) => x.r >= 0)
      .sort((a, b) => a.r - b.r || a.i - b.i)
      .map((x) => x.o);
  }, [options, query]);

  const custom = allowCustom && query?.trim() && !results.some((o) => normalize(o.label) === normalize(query))
    ? query.trim()
    : null;
  const total = results.length + (custom ? 1 : 0);

  function choose(v: string) {
    onChange(v);
    setQuery(null);
    setOpen(false);
  }

  function move(delta: number) {
    if (!open) return setOpen(true);
    const next = (active + delta + total) % Math.max(total, 1);
    setActive(next);
    listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      move(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      if (active < results.length) choose(results[active].value);
      else if (custom) choose(custom);
    } else if (e.key === "Escape") {
      setQuery(null);
      setOpen(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5" data-field={id}>
      <label htmlFor={id} className="text-sm font-medium text-body">
        {label} {optional && <span className="font-normal text-muted">(необов’язково)</span>}
      </label>
      <div className="relative">
        <svg className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && total ? `${listId}-${active}` : undefined}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          placeholder={placeholder}
          value={shown}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={(e) => {
            e.target.select();
            setOpen(true);
          }}
          onClick={() => setOpen(true)}
          onBlur={() => {
            // a click on an option fires first (mousedown below), so this only handles "left the field"
            if (custom && allowCustom) onChange(custom);
            setQuery(null);
            setOpen(false);
          }}
          onKeyDown={onKeyDown}
          className={`${inputClass(!!error)} truncate pl-11 ${value ? "pr-11" : ""} disabled:cursor-not-allowed disabled:bg-mint-tint/40 disabled:text-muted`}
        />
        {value && !disabled && (
          <button
            type="button"
            aria-label={`Очистити: ${label}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange("");
              setQuery("");
              setOpen(true);
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-ink"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        )}

        {open && !disabled && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label}
            className="absolute inset-x-0 top-full z-30 mt-2 max-h-72 animate-fade-in overflow-auto rounded-2xl border-2 border-line bg-white p-1.5 shadow-float"
          >
            {results.map((o, i) => (
              <li
                key={o.value}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={o.value === value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(o.value)}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-start justify-between gap-3 rounded-xl px-3 py-2.5 text-sm ${
                  i === active ? "bg-mint-tint" : ""
                } ${o.value === value ? "font-bold text-ink" : "text-ink"}`}
              >
                <span>
                  {o.label}
                  {o.hint && <span className="block text-xs font-normal text-muted">{o.hint}</span>}
                </span>
                {o.value === value && (
                  <svg className="mt-0.5 size-4 shrink-0 text-mint-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                )}
              </li>
            ))}
            {custom && (
              <li
                id={`${listId}-${results.length}`}
                role="option"
                aria-selected={false}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(custom)}
                onMouseEnter={() => setActive(results.length)}
                className={`cursor-pointer rounded-xl px-3 py-2.5 text-sm text-mint-dark ${active === results.length ? "bg-mint-tint" : ""}`}
              >
                Немає в списку — вказати «<span className="font-medium">{custom}</span>»
              </li>
            )}
            {total === 0 && <li className="px-3 py-2.5 text-sm text-muted">{emptyText}</li>}
          </ul>
        )}
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}
