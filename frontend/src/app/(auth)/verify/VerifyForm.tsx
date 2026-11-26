"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CODE_LENGTH as LENGTH, CodeInput, emptyCode as empty, noBadBoxes } from "@/components/CodeInput";
import { Alert, Button, FieldError, SuccessOverlay } from "@/components/ui";
import { ApiError, authApi } from "@/lib/api";
import { shake, wait } from "@/lib/motion";
import { clearPendingEmail, getPendingEmail, setToken } from "@/lib/session";

const RESEND_SECONDS = 60;

export function VerifyForm() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [digits, setDigits] = useState<string[]>(empty);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [error, setError] = useState<string>();
  const [badBoxes, setBadBoxes] = useState<boolean[]>(() => Array(LENGTH).fill(false));
  const [notice, setNotice] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const boxesRef = useRef<HTMLDivElement>(null);
  const lastSubmitted = useRef<string>("");

  // The email comes from sign-up / login (sessionStorage). Without it there's nothing to confirm.
  useEffect(() => {
    const pending = getPendingEmail();
    if (!pending) router.replace("/register");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage is only readable after mount
    else setEmail(pending);
    // Next (cacheComponents) keeps this page's state when you leave it — start clean on every visit.
    return () => {
      setSuccess(false);
      setLoading(false);
      setDigits(empty());
      setError(undefined);
      setBadBoxes(Array(LENGTH).fill(false));
      setNotice(undefined);
      setSeconds(RESEND_SECONDS);
      lastSubmitted.current = "";
    };
  }, [router]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  function showError(message: string, boxes: boolean[] = Array(LENGTH).fill(true)) {
    setError(message);
    setBadBoxes(boxes);
    shake(boxesRef.current);
  }

  function clearError() {
    setError(undefined);
    setBadBoxes(Array(LENGTH).fill(false));
  }

  const submit = useCallback(
    async (code: string) => {
      if (!email || loading) return;
      lastSubmitted.current = code;
      setLoading(true);
      try {
        const { accessToken } = await authApi.verifyEmail({ email, code });
        clearPendingEmail();
        setSuccess(true);
        await wait(1500);
        setToken(accessToken); // after the animation — saving the token sends guest pages to /app
        router.push("/onboarding"); // a new account always fills the profile first
      } catch (err) {
        setLoading(false);
        const e = err instanceof ApiError ? err : null;
        showError(e?.message ?? "Щось пішло не так, спробуй ще раз");
        if (e?.code === "CODE_EXPIRED" || e?.code === "TOO_MANY_ATTEMPTS") setSeconds(0); // allow resend now
        if (e?.code === "CODE_INVALID" || e?.code === "CODE_EXPIRED" || e?.code === "TOO_MANY_ATTEMPTS") {
          setDigits(empty());
          inputs.current[0]?.focus();
        }
      }
    },
    [email, loading, router],
  );

  // All 6 digits typed/pasted → confirm automatically (once per code).
  useEffect(() => {
    const code = digits.join("");
    if (code.length === LENGTH && code !== lastSubmitted.current) submit(code);
  }, [digits, submit]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const missing = digits.map((d) => !d);
    if (missing.some(Boolean)) {
      showError("Введи всі 6 цифр коду", missing);
      inputs.current[missing.indexOf(true)]?.focus();
      return;
    }
    submit(digits.join(""));
  }

  async function resend() {
    if (!email) return;
    clearError();
    setNotice(undefined);
    try {
      await authApi.resendCode(email);
      setNotice("Новий код уже на пошті");
      setSeconds(RESEND_SECONDS);
      setDigits(empty());
      lastSubmitted.current = "";
      inputs.current[0]?.focus();
    } catch (err) {
      const e = err instanceof ApiError ? err : null;
      if (e?.code === "ALREADY_VERIFIED") {
        clearPendingEmail();
        return router.push("/login");
      }
      if (e?.code === "RESEND_TOO_SOON") setSeconds(RESEND_SECONDS);
      showError(e?.message ?? "Не вдалося надіслати код, спробуй ще раз", Array(LENGTH).fill(false));
    }
  }

  return (
    <>
      {success && <SuccessOverlay title="Пошту підтверджено!" text="Ласкаво просимо в Roomie" />}

      {email && (
        <p className="mt-2 text-body">
          Ми надіслали 6-значний код на <span className="font-medium text-ink">{email}</span>. Він діє 10 хвилин.{" "}
          <Link href="/register" className="font-medium text-mint-dark underline-offset-4 hover:underline">
            Змінити пошту
          </Link>
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6" noValidate>
        <div>
          <CodeInput
            label="Код підтвердження"
            digits={digits}
            setDigits={setDigits}
            bad={badBoxes}
            readOnly={loading}
            errorId={error ? "code-error" : undefined}
            inputs={inputs}
            boxesRef={boxesRef}
            onBadChar={(i) => showError("Код складається лише з цифр", noBadBoxes().map((_, j) => j === i))}
            onTyped={() => {
              clearError();
              setNotice(undefined);
            }}
          />
          <div className="mt-3">
            <FieldError id="code-error">{error}</FieldError>
          </div>
        </div>

        {notice && <Alert tone="info">{notice}</Alert>}

        <Button type="submit" loading={loading} className="w-full py-3.5 text-lg">
          {loading ? "Перевіряємо…" : "Підтвердити"}
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
    </>
  );
}
