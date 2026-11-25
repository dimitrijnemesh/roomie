"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CODE_LENGTH, CodeInput, emptyCode, noBadBoxes } from "@/components/CodeInput";
import { EmailField } from "@/components/EmailField";
import { NEW_PASSWORD_RULES, PasswordField, PasswordRules } from "@/components/PasswordField";
import { Alert, Button, FieldError, SuccessOverlay } from "@/components/ui";
import { ApiError, authApi } from "@/lib/api";
import { shake, wait } from "@/lib/motion";
import { setToken } from "@/lib/session";
import { useForm } from "@/lib/useForm";
import { PASSWORD_RULES, normalizeEmail, validateEmail, validateNewPassword, validatePasswordRepeat } from "@/lib/validation";

const RESEND_SECONDS = 60;
const CODE_ERRORS = ["CODE_INVALID", "CODE_EXPIRED", "TOO_MANY_ATTEMPTS"];

/** «Забули пароль?»: email → code from the letter + new password → logged in. */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState<string | null>(null);

  // Next (cacheComponents) keeps this page's state when you leave it — start from the first step next time.
  useEffect(() => () => setEmail(null), []);

  return email ? <ResetStep email={email} onChangeEmail={() => setEmail(null)} /> : <EmailStep onSent={setEmail} />;
}

function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const { attachForm, ...form } = useForm({ email: "" }, (v) => ({ email: validateEmail(v.email) }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (!form.check()) return;

    const email = normalizeEmail(form.values.email);
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      onSent(email);
    } catch (err) {
      setLoading(false);
      setError(err instanceof ApiError ? err.message : "Щось пішло не так, спробуй ще раз");
    }
  }

  return (
    <>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">Забули пароль?</h1>
      <p className="mt-2 text-body">Введи свою студентську пошту — надішлемо код, щоб придумати новий пароль.</p>
      <form ref={attachForm} onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-4">
        {error && <Alert>{error}</Alert>}
        <EmailField {...form.bind("email")} onSuggest={(v) => form.setValue("email", v)} />
        <Button type="submit" loading={loading} className="mt-4 w-full py-3.5 text-lg">
          {loading ? "Надсилаємо…" : "Надіслати код"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-body">
        Згадав пароль?{" "}
        <Link href="/login" className="font-medium text-mint-dark underline-offset-4 hover:underline">
          Увійти
        </Link>
      </p>
    </>
  );
}

function ResetStep({ email, onChangeEmail }: { email: string; onChangeEmail: () => void }) {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(emptyCode);
  const [badBoxes, setBadBoxes] = useState<boolean[]>(noBadBoxes);
  const [codeError, setCodeError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [error, setError] = useState<string>();
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const boxesRef = useRef<HTMLDivElement>(null);

  const { attachForm, ...form } = useForm({ newPassword: "", repeatPassword: "" }, (v) => ({
    newPassword: validateNewPassword(v.newPassword),
    repeatPassword: validatePasswordRepeat(v.newPassword, v.repeatPassword),
  }));
  const pwd = form.values.newPassword;
  const rules = PASSWORD_RULES.map((r) => ({ id: r.id, label: r.label, ok: r.test(pwd) }));

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  function showCodeError(message: string, boxes = Array<boolean>(CODE_LENGTH).fill(true)) {
    setCodeError(message);
    setBadBoxes(boxes);
    shake(boxesRef.current);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setNotice(undefined);

    const missing = digits.map((d) => !d);
    const passwordOk = form.check();
    if (missing.some(Boolean)) {
      showCodeError("Введи всі 6 цифр коду", missing);
      inputs.current[missing.indexOf(true)]?.focus();
      return;
    }
    if (!passwordOk) return;

    setLoading(true);
    try {
      const { accessToken, user } = await authApi.resetPassword({ email, code: digits.join(""), newPassword: pwd });
      setSuccess(true);
      await wait(1500);
      setToken(accessToken); // after the animation — saving the token sends guest pages to /app
      router.push(user.onboarded ? "/app" : "/onboarding");
    } catch (err) {
      setLoading(false);
      const e = err instanceof ApiError ? err : null;
      if (e && CODE_ERRORS.includes(e.code)) {
        showCodeError(e.message);
        setDigits(emptyCode());
        inputs.current[0]?.focus();
        if (e.code !== "CODE_INVALID") setSeconds(0); // expired / too many attempts → a new code is needed now
      } else if (e?.field === "newPassword") {
        form.setServerError("newPassword", e.message);
      } else {
        setError(e?.message ?? "Щось пішло не так, спробуй ще раз");
      }
    }
  }

  async function resend() {
    setCodeError(undefined);
    setBadBoxes(noBadBoxes());
    try {
      await authApi.forgotPassword(email);
      setNotice("Новий код уже на пошті");
      setSeconds(RESEND_SECONDS);
      setDigits(emptyCode());
      inputs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не вдалося надіслати код, спробуй ще раз");
    }
  }

  return (
    <>
      {success && <SuccessOverlay title="Пароль змінено!" text="Заходимо в Roomie…" />}

      <h1 className="font-display text-2xl font-bold sm:text-3xl">Новий пароль</h1>
      <p className="mt-2 text-body">
        Якщо <span className="font-medium text-ink">{email}</span> зареєстрована в Roomie, ми надіслали на неї код. Він діє 10
        хвилин.{" "}
        <button type="button" onClick={onChangeEmail} className="font-medium text-mint-dark underline-offset-4 hover:underline">
          Змінити пошту
        </button>
      </p>

      <form ref={attachForm} name="reset-password" onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-4">
        {/* Lets password managers save the new password for the right account */}
        <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
        {error && <Alert>{error}</Alert>}

        <div>
          <p className="mb-1.5 text-sm font-medium text-body">Код з листа</p>
          <CodeInput
            label="Код з листа"
            digits={digits}
            setDigits={setDigits}
            bad={badBoxes}
            readOnly={loading}
            errorId={codeError ? "code-error" : undefined}
            inputs={inputs}
            boxesRef={boxesRef}
            onBadChar={(i) => showCodeError("Код складається лише з цифр", noBadBoxes().map((_, j) => j === i))}
            onTyped={() => {
              setCodeError(undefined);
              setBadBoxes(noBadBoxes());
            }}
          />
          <div className="mt-3">
            <FieldError id="code-error">{codeError}</FieldError>
          </div>
        </div>

        <PasswordField
          id="newPassword"
          label="Новий пароль"
          placeholder="Мінімум 8 символів"
          autoComplete="new-password"
          passwordRules={NEW_PASSWORD_RULES}
          {...form.bind("newPassword")}
        >
          {(pwd || form.errors.newPassword) && <PasswordRules rules={rules} />}
        </PasswordField>
        <PasswordField
          id="repeatPassword"
          label="Повтори новий пароль"
          autoComplete="new-password"
          passwordRules={NEW_PASSWORD_RULES}
          {...form.bind("repeatPassword")}
        />

        {notice && <Alert tone="info">{notice}</Alert>}

        <Button type="submit" loading={loading} className="mt-2 w-full py-3.5 text-lg">
          {loading ? "Змінюємо…" : "Змінити пароль"}
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
