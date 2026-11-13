"use client";

import { useRouter } from "next/navigation";
import { PasswordField } from "@/components/PasswordField";
import { Button, Field } from "@/components/ui";
import { EMAIL_PLACEHOLDER } from "@/lib/universities";

export function LoginForm() {
  const router = useRouter();

  // TODO: validation + POST /auth/login
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push("/app");
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4" noValidate>
      <Field id="email" label="Пошта" type="email" placeholder={EMAIL_PLACEHOLDER} autoComplete="email" />
      <PasswordField id="password" label="Пароль" autoComplete="current-password" />
      <Button type="submit" className="mt-4 w-full py-3.5 text-lg">
        Увійти
      </Button>
    </form>
  );
}
