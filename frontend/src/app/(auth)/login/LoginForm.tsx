"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmailField } from "@/components/EmailField";
import { PasswordField } from "@/components/PasswordField";
import { Alert, Button, SuccessOverlay, buttonClass } from "@/components/ui";
import { ApiError, authApi } from "@/lib/api";
import { wait } from "@/lib/motion";
import { clearPendingEmail, getPendingEmail, setPendingEmail, setToken } from "@/lib/session";
import { useForm } from "@/lib/useForm";
import { normalizeEmail, validateEmail, validateLoginPassword } from "@/lib/validation";

type Status = { kind: "idle" } | { kind: "invalid" } | { kind: "error"; message: string };

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [welcome, setWelcome] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const { attachForm, ...form } = useForm({ email: "", password: "" }, (v) => ({
    email: validateEmail(v.email),
    password: validateLoginPassword(v.password),
  }));

  // Came from "email taken" on sign-up → prefill the email. On leave, start clean next visit.
  const { reset, setValue } = form;
  useEffect(() => {
    const pending = getPendingEmail();
    if (pending) setValue("email", pending);
    return () => {
      setWelcome(null);
      setLoading(false);
      setStatus({ kind: "idle" });
      reset();
    };
  }, [reset, setValue]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "idle" });
    if (!form.check()) return;

    const email = normalizeEmail(form.values.email);
    setLoading(true);
    try {
      const { accessToken, user } = await authApi.login({ email, password: form.values.password });
      clearPendingEmail();
      setWelcome(user.name);
      await wait(1300);
      setToken(accessToken); // after the animation — saving the token sends guest pages to /app
      router.push(user.onboarded ? "/app" : "/onboarding");
    } catch (err) {
      setLoading(false);
      if (!(err instanceof ApiError)) return setStatus({ kind: "error", message: "Щось пішло не так, спробуй ще раз" });
      switch (err.code) {
        case "INVALID_CREDENTIALS":
          // Same answer for unknown email and wrong password — highlight both, clear the password.
          form.setValue("password", "");
          form.markInvalid(["email", "password"]);
          return setStatus({ kind: "invalid" });
        case "EMAIL_NOT_VERIFIED":
          // Send a fresh code (ignore "too soon" — an earlier code is still valid) and go confirm.
          setPendingEmail(email);
          await authApi.resendCode(email).catch(() => {});
          return router.push("/verify");
        default:
          if (err.field === "email" || err.field === "password") return form.setServerError(err.field, err.message);
          setStatus({ kind: "error", message: err.message });
      }
    }
  }

  return (
    <>
      {welcome && <SuccessOverlay title={`Привіт, ${welcome}!`} text="Заходимо в Roomie…" />}
      <form ref={attachForm} name="login" method="post" action="#" onSubmit={onSubmit} className="mt-8 flex flex-col gap-4" noValidate>
        {status.kind === "invalid" && (
          <Alert
            action={
              <Link href="/register" className={buttonClass("secondary", "px-5 py-2 text-sm")}>
                Зареєструватися
              </Link>
            }
          >
            Невірна пошта або пароль. Перевір дані й спробуй ще раз — або зареєструйся, якщо ще не маєш акаунта.
          </Alert>
        )}
        {status.kind === "error" && <Alert>{status.message}</Alert>}

        <EmailField {...form.bind("email")} onSuggest={(v) => form.setValue("email", v)} />
        <PasswordField
          id="password"
          label="Пароль"
          autoComplete="current-password"
          enterKeyHint="go"
          {...form.bind("password")}
        />
        <Button type="submit" loading={loading} className="mt-4 w-full py-3.5 text-lg">
          {loading ? "Входимо…" : "Увійти"}
        </Button>
      </form>
    </>
  );
}
