"use client";

import { PageLoading, useApp } from "@/components/AppShell";
import { ProfileCard } from "@/components/ProfileCard";

// Placeholder: the feed (swipes, matches, chat) comes in sprint 3. For now: your own card.
export function AppHome() {
  const app = useApp();
  if (!app) return <PageLoading />;
  const { profile } = app;

  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-4 py-10">
      <div className="w-full max-w-md animate-rise text-center">
        <p className="text-xs font-bold uppercase tracking-[2px] text-mint-dark">Ти в Roomie</p>
        <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Привіт, {profile.name}!</h1>
        <p className="mt-2 text-body">Так твою анкету бачитимуть інші. Стрічка зі свайпами — вже скоро.</p>
      </div>
      <ProfileCard profile={profile} className="animate-rise [animation-delay:120ms]" />
    </main>
  );
}
