import type { Metadata } from "next";
import Link from "next/link";
import { UniversityList } from "@/components/UniversityList";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = { title: "Реєстрація — Roomie" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">Реєстрація</h1>
      <p className="mt-2 text-body">Потрібна корпоративна пошта твого вишу.</p>
      <details className="mt-3 rounded-2xl bg-mint-tint px-4 py-3 text-sm text-body">
        <summary className="cursor-pointer font-medium text-mint-dark">Які пошти підходять?</summary>
        <UniversityList className="mt-3" />
      </details>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-body">
        Вже маєш акаунт?{" "}
        <Link href="/login" className="font-medium text-mint-dark underline-offset-4 hover:underline">
          Увійти
        </Link>
      </p>
    </>
  );
}
