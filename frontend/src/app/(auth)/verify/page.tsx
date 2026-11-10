import type { Metadata } from "next";
import { VerifyForm } from "./VerifyForm";

export const metadata: Metadata = { title: "Підтвердження пошти — Roomie" };

export default function VerifyPage() {
  return (
    <>
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-mint-tint text-mint-dark">
        <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      </div>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">Підтвердь пошту</h1>
      <p className="mt-2 text-body">Ми надіслали 6-значний код на твою університетську пошту. Він діє 10 хвилин.</p>
      <VerifyForm />
    </>
  );
}
