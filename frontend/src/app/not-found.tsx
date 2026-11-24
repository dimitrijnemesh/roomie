import type { Metadata } from "next";
import { Brand, ButtonLink } from "@/components/ui";

export const metadata: Metadata = { title: "Сторінку не знайдено — Roomie" };

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-mint-tint/60">
      <header className="mx-auto flex h-[60px] w-full max-w-6xl items-center px-4 sm:h-[72px] sm:px-6">
        <Brand size={36} />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg animate-rise rounded-3xl bg-white p-8 text-center shadow-float sm:p-12">
          {/* A door with a key that fits nowhere */}
          <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-mint-tint text-mint-dark">
            <svg className="size-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="7.5" cy="15.5" r="4" />
              <path d="M10.5 12.5 20 3M16 7l3 3M18 5l2 2" />
            </svg>
          </div>

          <p className="mt-6 font-display text-7xl font-extrabold text-mint sm:text-8xl">404</p>
          <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">Такої кімнати немає</h1>
          <p className="mx-auto mt-3 max-w-sm text-body">
            Сторінку не знайдено. Можливо, посилання застаріло або в адресі є помилка.
          </p>

          <ButtonLink href="/" className="mt-8 px-8 py-3.5 text-lg">
            На головну
          </ButtonLink>
        </div>
      </main>
    </div>
  );
}
