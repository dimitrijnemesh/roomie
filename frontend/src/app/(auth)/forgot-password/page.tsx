import type { Metadata } from "next";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "Відновлення пароля — Roomie" };

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-mint-tint text-mint-dark">
        <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="7.5" cy="15.5" r="4" />
          <path d="M10.5 12.5 20 3M16 7l3 3M18 5l2 2" />
        </svg>
      </div>
      <ForgotPasswordForm />
    </>
  );
}
