import type { Metadata } from "next";
import { Brand, ButtonLink } from "@/components/ui";

export const metadata: Metadata = { title: "Стрічка — Roomie" };

// Placeholder: the feed (swipes, matches, chat) comes in week 2–3.
export default function AppHome() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line/60 bg-white">
        <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between px-4 sm:h-[72px] sm:px-6">
          <Brand size={36} />
          <ButtonLink href="/" variant="outline" className="px-4 py-2 text-sm">
            Вийти
          </ButtonLink>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl bg-ink p-8 text-center text-on-dark shadow-float sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[2px] text-mint-light">Ти в Roomie</p>
          <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl">Вітаємо!</h1>
          <p className="mt-3 text-on-dark-2">
            Тут скоро з’являться анкета, стрічка зі свайпами, метчі й чат.
          </p>
        </div>
      </main>
    </div>
  );
}
