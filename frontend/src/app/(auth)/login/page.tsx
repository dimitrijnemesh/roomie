import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Вхід — Roomie" };

export default function LoginPage() {
  return (
    <>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">Вхід</h1>
      <p className="mt-2 text-body">Радий тебе знову бачити!</p>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-body">
        Ще немає акаунта?{" "}
        <Link href="/register" className="font-medium text-mint-dark underline-offset-4 hover:underline">
          Зареєструватися
        </Link>
      </p>
    </>
  );
}
