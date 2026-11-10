"use client";

import { useRouter } from "next/navigation";
import { PasswordField } from "@/components/PasswordField";
import { Button, Field } from "@/components/ui";
import { EMAIL_PLACEHOLDER } from "@/lib/universities";

export function RegisterForm() {
  const router = useRouter();

  // TODO: validation + POST /auth/register
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push("/verify");
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4" noValidate>
      <Field id="email" label="Пошта" type="email" placeholder={EMAIL_PLACEHOLDER} autoComplete="email" />
      <Field id="name" label="Ім’я" placeholder="Іван" autoComplete="given-name" />
      <PasswordField id="password" label="Пароль" placeholder="Мінімум 8 символів" autoComplete="new-password" />
      <PasswordField id="password2" label="Повтори пароль" autoComplete="new-password" />
      <Button type="submit" className="mt-4 w-full py-3.5 text-lg">
        Зареєструватися
      </Button>
    </form>
  );
}
