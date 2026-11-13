"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";

const LENGTH = 6;
const RESEND_SECONDS = 60;

export function VerifyForm() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  function fill(start: number, text: string) {
    const chars = text.replace(/\D/g, "").slice(0, LENGTH - start).split("");
    if (!chars.length) return;
    setDigits((prev) => {
      const next = [...prev];
      chars.forEach((c, i) => (next[start + i] = c));
      return next;
    });
    inputs.current[Math.min(start + chars.length, LENGTH - 1)]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) {
      inputs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < LENGTH - 1) {
      inputs.current[i + 1]?.focus();
    }
  }

  // TODO: POST /auth/verify-email
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push("/app");
  }

  // TODO: POST /auth/resend-code
  function resend() {
    setSeconds(RESEND_SECONDS);
    setDigits(Array(LENGTH).fill(""));
    inputs.current[0]?.focus();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
      <fieldset>
        <legend className="sr-only">Код підтвердження</legend>
        <div className="flex justify-between gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              value={d}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={LENGTH}
              aria-label={`Цифра ${i + 1}`}
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
                fill(i, e.clipboardData.getData("text"));
              }}
              onFocus={(e) => e.target.select()}
              className="h-14 w-full min-w-0 rounded-[14px] border-2 border-line bg-white text-center font-display text-2xl font-bold text-ink outline-none transition-colors focus:border-mint sm:h-16"
            />
          ))}
        </div>
      </fieldset>

      <Button type="submit" className="w-full py-3.5 text-lg">
        Підтвердити
      </Button>

      <p className="text-center text-sm text-body">
        {seconds > 0 ? (
          <>
            Надіслати код повторно через <span className="font-medium tabular-nums text-ink">{seconds} с</span>
          </>
        ) : (
          <button type="button" onClick={resend} className="font-medium text-mint-dark underline-offset-4 hover:underline">
            Надіслати код ще раз
          </button>
        )}
      </p>
    </form>
  );
}
