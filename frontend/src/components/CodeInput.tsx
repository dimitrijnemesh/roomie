"use client";

import type { RefObject } from "react";

export const CODE_LENGTH = 6;
export const emptyCode = () => Array<string>(CODE_LENGTH).fill("");
export const noBadBoxes = () => Array<boolean>(CODE_LENGTH).fill(false);

/**
 * Six boxes for an email code: typing, Backspace / arrows between boxes, pasting the whole code,
 * one-time-code autofill. Used on /verify and /forgot-password.
 */
export function CodeInput({
  digits,
  setDigits,
  bad,
  readOnly,
  label,
  errorId,
  inputs,
  boxesRef,
  onBadChar,
  onTyped,
}: {
  digits: string[];
  setDigits: React.Dispatch<React.SetStateAction<string[]>>;
  /** Boxes to show red */
  bad: boolean[];
  readOnly?: boolean;
  label: string;
  /** id of the error text under the boxes */
  errorId?: string;
  inputs: RefObject<(HTMLInputElement | null)[]>;
  boxesRef: RefObject<HTMLDivElement | null>;
  /** A letter or another non-digit was typed into box `index` */
  onBadChar: (index: number) => void;
  /** Digits were typed or pasted — a good moment to clear errors */
  onTyped?: () => void;
}) {
  function fill(start: number, text: string) {
    if (/\D/.test(text)) return onBadChar(start);
    const chars = text.slice(0, CODE_LENGTH - start).split("");
    if (!chars.length) return;
    onTyped?.();
    setDigits((prev) => {
      const next = [...prev];
      chars.forEach((c, i) => (next[start + i] = c));
      return next;
    });
    inputs.current[Math.min(start + chars.length, CODE_LENGTH - 1)]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) {
      inputs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < CODE_LENGTH - 1) {
      inputs.current[i + 1]?.focus();
    }
  }

  return (
    <fieldset aria-describedby={errorId}>
      <legend className="sr-only">{label}</legend>
      <div ref={boxesRef} className="flex justify-between gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={d}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={CODE_LENGTH}
            readOnly={readOnly}
            aria-label={`Цифра ${i + 1}`}
            aria-invalid={bad[i] || undefined}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") {
                setDigits((prev) => prev.map((x, j) => (j === i ? "" : x)));
              } else {
                // typing over an existing digit gives two chars — keep the new one
                const typed = d && v.length === 2 ? (v[0] === d ? v[1] : v[0]) : v;
                fill(i, typed);
              }
            }}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={(e) => {
              e.preventDefault();
              fill(i, e.clipboardData.getData("text").replace(/[\s-]/g, ""));
            }}
            onFocus={(e) => e.target.select()}
            className={`h-14 w-full min-w-0 rounded-[14px] border-2 text-center font-display text-2xl font-bold text-ink outline-none transition-colors read-only:opacity-60 sm:h-16 ${
              bad[i]
                ? "border-warning bg-warning/5 focus:border-warning"
                : d
                  ? "border-mint bg-mint-tint/50 focus:border-mint"
                  : "border-line bg-white focus:border-mint"
            }`}
          />
        ))}
      </div>
    </fieldset>
  );
}
