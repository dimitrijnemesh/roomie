"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Brand, Button, Spinner } from "@/components/ui";
import { DEGREE_LABEL, findFaculty } from "@/lib/academics";
import { authApi, profileApi, type Profile } from "@/lib/api";
import { CLEAN_OPTIONS, GUESTS_OPTIONS, HOUSING_OPTIONS, ROOMMATE_OPTIONS, SLEEP_OPTIONS } from "@/lib/profile";
import { clearToken, getToken } from "@/lib/session";

const label = <T,>(opts: readonly { value: T; label: string }[], v: T | undefined) => opts.find((o) => o.value === v)?.label;

// Placeholder: the feed (swipes, matches, chat) comes in week 2–3. For now: your own card.
export function AppHome() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  // Logged-in users with a finished profile only.
  useEffect(() => {
    if (!getToken()) return router.replace("/login");
    Promise.all([authApi.me(), profileApi.get()])
      .then(([user, p]) => (user.onboarded ? setProfile(p) : router.replace("/onboarding")))
      .catch(() => {
        clearToken();
        router.replace("/login");
      });
    return () => setProfile(null); // don't show a previous user's data on the next visit
  }, [router]);

  function logout() {
    clearToken();
    router.push("/");
  }

  if (!profile) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-mint-dark" role="status" aria-label="Завантаження">
        <Spinner className="size-8" />
      </div>
    );
  }

  const h = profile.habits ?? {};
  const l = profile.looking ?? {};
  const chips = [
    label(SLEEP_OPTIONS, h.sleep),
    `Чистота: ${CLEAN_OPTIONS.find((o) => o.value === h.clean)?.hint.toLowerCase()}`,
    h.smoking ? "Курю" : "Не курю",
    `Гості: ${label(GUESTS_OPTIONS, h.guests)?.toLowerCase()}`,
  ].filter(Boolean);

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
      <main className="flex flex-1 flex-col items-center gap-6 px-4 py-10">
        <div className="w-full max-w-md animate-rise text-center">
          <p className="text-xs font-bold uppercase tracking-[2px] text-mint-dark">Ти в Roomie</p>
          <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Привіт, {profile.name}!</h1>
          <p className="mt-2 text-body">Так твою анкету бачитимуть інші. Стрічка зі свайпами — вже скоро.</p>
        </div>

        {/* Own card preview */}
        <article className="w-full max-w-sm animate-rise overflow-hidden rounded-3xl bg-white shadow-float [animation-delay:120ms]">
          <div className="relative aspect-[4/5] bg-mint-tint">
            {/* eslint-disable-next-line @next/next/no-img-element -- user uploads from the API host */}
            <img src={profile.photos[0]?.url} alt={`Фото ${profile.name}`} className="size-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent p-5 pt-16 text-white">
              <h2 className="font-display text-2xl font-bold">
                {profile.name}, {profile.age}
              </h2>
              <p className="text-on-dark-2">
                {profile.specialty} · {profile.course} курс, {DEGREE_LABEL[profile.degree ?? "bachelor"]}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 p-5">
            <p className="text-sm text-muted">
              {findFaculty(profile.university, profile.faculty)?.short ?? profile.faculty}
              {profile.specialization ? ` · ${profile.specialization}` : ""}
            </p>
            {profile.bio && <p className="text-body">{profile.bio}</p>}
            <ul className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <li key={c} className="rounded-full bg-mint-tint px-3 py-1 text-sm text-ink">
                  {c}
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted">
              Шукаю: {label(ROOMMATE_OPTIONS, l.roommateGender)?.toLowerCase()} · {label(HOUSING_OPTIONS, l.housing)?.toLowerCase()} ·{" "}
              {l.budget?.[0]}–{l.budget?.[1]} грн
              {l.district ? ` · ${l.district}` : ""}
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}
