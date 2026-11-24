"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmailField } from "@/components/EmailField";
import { NEW_PASSWORD_RULES, PasswordField, PasswordRules } from "@/components/PasswordField";
import { Alert, Button, Field, SuccessOverlay, buttonClass } from "@/components/ui";
import { ApiError, authApi } from "@/lib/api";
import { wait } from "@/lib/motion";
import { setPendingEmail } from "@/lib/session";
import { useForm } from "@/lib/useForm";
import {
  PASSWORD_RULES,
  normalizeEmail,
  validateEmail,
  validateName,
  validateNewPassword,
  validatePasswordRepeat,
} from "@/lib/validation";

type Status = { kind: "idle" } | { kind: "taken" } | { kind: "error"; message: string };

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const { attachForm, ...form } = useForm({ email: "", name: "", password: "", password2: "" }, (v) => ({
    email: validateEmail(v.email),
    name: validateName(v.name),
    password: validateNewPassword(v.password),
    password2: validatePasswordRepeat(v.password, v.password2),
  }));

  // Next (cacheComponents) keeps this page's state when you leave it — start clean on every visit.
  const { reset } = form;
  useEffect(
    () => () => {
      setSuccess(false);
      setLoading(false);
      setStatus({ kind: "idle" });
      reset();
    },
    [reset],
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "idle" });
    if (!form.check()) return;

    const email = normalizeEmail(form.values.email);
    setLoading(true);
    try {
      await authApi.register({ email, name: form.values.name.trim(), password: form.values.password });
      setPendingEmail(email);
      setSuccess(true);
      await wait(1400);
      router.push("/verify");
    } catch (err) {
      setLoading(false);
      if (!(err instanceof ApiError)) return setStatus({ kind: "error", message: "Щось пішло не так, спробуй ще раз" });
      if (err.code === "EMAIL_TAKEN") {
        setPendingEmail(email); // prefill on /login
        form.setServerError("email", "Ця пошта вже зареєстрована");
        return setStatus({ kind: "taken" });
      }
      const field = err.field as "email" | "name" | "password" | undefined;
      if (field && field in form.values) return form.setServerError(field, err.message);
      setStatus({ kind: "error", message: err.message });
    }
  }

  const pwd = form.values.password;
  const rules = PASSWORD_RULES.map((r) => ({ id: r.id, label: r.label, ok: r.test(pwd) }));

  return (
    <>
      {success && <SuccessOverlay title="Майже готово!" text={`Ми надіслали код на ${normalizeEmail(form.values.email)}`} />}
      <form ref={attachForm} name="register" method="post" action="#" onSubmit={onSubmit} className="mt-8 flex flex-col gap-4" noValidate>
        {status.kind === "taken" && (
          <Alert
            action={
              <Link href="/login" className={buttonClass("secondary", "px-5 py-2 text-sm")}>
                Увійти
              </Link>
            }
          >
            Користувач із такою поштою вже зареєстрований. Якщо це ти — просто увійди.
          </Alert>
        )}
        {status.kind === "error" && <Alert>{status.message}</Alert>}

        <EmailField {...form.bind("email")} onSuggest={(v) => form.setValue("email", v)} />
        <Field
          id="name"
          label="Ім’я"
          placeholder="Іван"
          autoComplete="given-name"
          autoCapitalize="words"
          enterKeyHint="next"
          {...form.bind("name")}
        />
        <PasswordField
          id="password"
          label="Пароль"
          placeholder="Мінімум 8 символів"
          autoComplete="new-password"
          passwordRules={NEW_PASSWORD_RULES}
          enterKeyHint="next"
          {...form.bind("password")}
        >
          {(pwd || form.errors.password) && <PasswordRules rules={rules} />}
        </PasswordField>
        <PasswordField
          id="password2"
          label="Повтори пароль"
          autoComplete="new-password"
          passwordRules={NEW_PASSWORD_RULES}
          enterKeyHint="done"
          {...form.bind("password2")}
        />

        <Button type="submit" loading={loading} className="mt-4 w-full py-3.5 text-lg">
          {loading ? "Реєструємо…" : "Зареєструватися"}
        </Button>
      </form>
    </>
  );
}
