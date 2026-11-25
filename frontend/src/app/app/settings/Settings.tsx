"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PageLoading, useApp } from "@/components/AppShell";
import { NEW_PASSWORD_RULES, PasswordField, PasswordRules } from "@/components/PasswordField";
import { Alert, Button, SuccessOverlay } from "@/components/ui";
import { ApiError, authApi } from "@/lib/api";
import { shake, wait } from "@/lib/motion";
import { universityName } from "@/lib/profile";
import { clearToken, setToken } from "@/lib/session";
import { useForm } from "@/lib/useForm";
import { PASSWORD_RULES, validateLoginPassword, validateNewPassword, validatePasswordRepeat } from "@/lib/validation";

export function Settings() {
  const app = useApp();
  if (!app) return <PageLoading />;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="animate-rise">
        <p className="text-xs font-bold uppercase tracking-[2px] text-mint-dark">Акаунт</p>
        <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Налаштування</h1>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <Card title="Пошта">
          <p className="font-medium text-ink">{app.user.email}</p>
          <p className="mt-1 text-sm text-muted">
            {universityName(app.user.email)} · пошту змінити не можна — вона підтверджує, що ти студент.
          </p>
        </Card>

        <Card title="Безпека" subtitle="Після зміни пароля на інших пристроях доведеться увійти знову.">
          <ChangePasswordForm email={app.user.email} />
        </Card>

        <Card title="Видалити акаунт" subtitle="Назавжди видалимо анкету, фото, метчі й чати. Відновити їх не вийде." danger>
          <DeleteAccount />
        </Card>
      </div>
    </main>
  );
}

function Card({
  title,
  subtitle,
  danger,
  children,
}: {
  title: string;
  subtitle?: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`animate-rise rounded-3xl bg-white p-5 shadow-float sm:p-6 ${danger ? "ring-1 ring-warning/30" : ""}`}>
      <h2 className={`font-display text-lg font-bold ${danger ? "text-warning" : ""}`}>{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-body">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ChangePasswordForm({ email }: { email: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string>();

  const { attachForm, ...form } = useForm({ currentPassword: "", newPassword: "", repeatPassword: "" }, (v) => ({
    currentPassword: validateLoginPassword(v.currentPassword),
    newPassword: validateNewPassword(v.newPassword),
    repeatPassword: validatePasswordRepeat(v.newPassword, v.repeatPassword),
  }));
  const pwd = form.values.newPassword;
  const rules = PASSWORD_RULES.map((r) => ({ id: r.id, label: r.label, ok: r.test(pwd) }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDone(false);
    setError(undefined);
    if (!form.check()) return;

    setLoading(true);
    try {
      const { accessToken } = await authApi.changePassword({
        currentPassword: form.values.currentPassword,
        newPassword: form.values.newPassword,
      });
      setToken(accessToken); // the old token no longer works
      form.reset();
      setDone(true);
    } catch (err) {
      const e = err instanceof ApiError ? err : null;
      if (e?.code === "WRONG_PASSWORD") form.setServerError("currentPassword", "Неправильний поточний пароль");
      else if (e?.field === "newPassword") form.setServerError("newPassword", e.message);
      else setError(e?.message ?? "Не вдалося змінити пароль, спробуй ще раз");
    }
    setLoading(false);
  }

  return (
    <form ref={attachForm} name="change-password" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {/* Lets password managers know which account the new password belongs to */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      {done && <Alert tone="info">Пароль змінено. На інших пристроях потрібно буде увійти з новим паролем.</Alert>}
      {error && <Alert>{error}</Alert>}

      <PasswordField id="currentPassword" label="Поточний пароль" autoComplete="current-password" {...form.bind("currentPassword")} />
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

      <Button type="submit" loading={loading} className="mt-2 w-full py-3.5 sm:w-auto sm:self-start sm:px-8">
        {loading ? "Змінюємо…" : "Змінити пароль"}
      </Button>
    </form>
  );
}

function DeleteAccount() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [deleted, setDeleted] = useState(false);

  function open() {
    setPassword("");
    setError(undefined);
    dialogRef.current?.showModal();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) {
      setError("Введи пароль, щоб підтвердити");
      shake(formRef.current?.querySelector('[data-field="deletePassword"] input'));
      return;
    }
    setLoading(true);
    try {
      await authApi.deleteAccount(password);
      dialogRef.current?.close();
      setDeleted(true);
      await wait(1800);
      clearToken();
      router.push("/");
    } catch (err) {
      setLoading(false);
      const e = err instanceof ApiError ? err : null;
      const input = formRef.current?.querySelector<HTMLInputElement>('[data-field="deletePassword"] input');
      if (e?.code === "WRONG_PASSWORD") {
        // Like on the login page: clear the wrong password and put the cursor back.
        setPassword("");
        setError("Пароль неправильний");
        input?.focus();
      } else {
        setError(e?.message ?? "Не вдалося видалити акаунт, спробуй ще раз");
      }
      shake(input);
    }
  }

  return (
    <>
      {/* Into <body>: the card animates with transform, which would trap a fixed overlay inside it */}
      {deleted && createPortal(<SuccessOverlay title="Акаунт видалено" text="Шкода, що ти йдеш. Повертайся будь-коли!" />, document.body)}

      <Button variant="outline" onClick={open} className="border-warning/40 text-warning hover:border-warning">
        Видалити акаунт
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="delete-title"
        onClose={() => setLoading(false)}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl bg-white p-6 text-ink shadow-float backdrop:bg-ink/50 backdrop:backdrop-blur-sm sm:p-8"
      >
        <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <h2 id="delete-title" className="font-display text-xl font-bold">
            Видалити акаунт назавжди?
          </h2>
          <ul className="list-disc pl-5 text-sm text-body">
            <li>анкета і всі фото</li>
            <li>метчі та листування</li>
            <li>скасувати це не вийде</li>
          </ul>
          <PasswordField
            id="deletePassword"
            label="Твій пароль"
            autoComplete="current-password"
            value={password}
            error={error}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(undefined);
            }}
          />
          <div className="mt-2 flex gap-3">
            <Button type="button" variant="outline" onClick={() => dialogRef.current?.close()} disabled={loading} className="px-5">
              Скасувати
            </Button>
            <Button type="submit" variant="danger" loading={loading} className="flex-1">
              {loading ? "Видаляємо…" : "Видалити назавжди"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
