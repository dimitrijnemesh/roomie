"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Brand, Button, Spinner } from "@/components/ui";
import { authApi, type User } from "@/lib/api";
import { clearToken, getToken } from "@/lib/session";

// Placeholder: the feed (swipes, matches, chat) comes in week 2–3.
export function AppHome() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // Only for logged-in users: check the token with GET /auth/me, otherwise → /login.
  useEffect(() => {
    if (!getToken()) return router.replace("/login");
    authApi
      .me()
      .then(setUser)
      .catch(() => {
        clearToken();
        router.replace("/login");
      });
    return () => setUser(null); // don't show a previous user's data on the next visit
  }, [router]);

  function logout() {
    clearToken();
    router.push("/");
  }

  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-mint-dark" role="status" aria-label="Завантаження">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line/60 bg-white">
        <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between px-4 sm:h-[72px] sm:px-6">
          <Brand size={36} href="/app" />
          <Button onClick={logout} variant="outline" className="px-4 py-2 text-sm">
            Вийти
          </Button>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md animate-rise rounded-3xl bg-ink p-8 text-center text-on-dark shadow-float sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[2px] text-mint-light">Ти в Roomie</p>
          <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl">Привіт, {user.name}!</h1>
          <p className="mt-3 text-on-dark-2">Тут скоро з’являться анкета, стрічка зі свайпами, метчі й чат.</p>
          <p className="mt-6 text-sm text-on-dark-2">{user.email}</p>
        </div>
      </main>
    </div>
  );
}
