"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Brand, Button, Spinner, SuccessOverlay } from "@/components/ui";
import { authApi, profileApi, type Profile } from "@/lib/api";
import { wait } from "@/lib/motion";
import { findSpecialty } from "@/lib/academics";
import { habitsComplete, lookingComplete, universityName } from "@/lib/profile";
import { clearToken, getToken } from "@/lib/session";
import { StepAbout, StepHabits, StepLooking, StepPhotos, StepStudy } from "./steps";

const STEPS = [
  { title: "Про мене", subtitle: "Кілька слів, щоб сусіди знали, хто ти." },
  { title: "Навчання", subtitle: "Обери зі списку свого вишу — так легше знайти одногрупників і сусідів поруч." },
  { title: "Фото", subtitle: "Покажи себе — так сусідам легше тебе впізнати." },
  { title: "Звички", subtitle: "Головне для спокійного життя разом." },
  { title: "Що шукаю", subtitle: "Підберемо тих, хто тобі підходить." },
];

/** Resume where the user stopped: the first step that is not filled yet. */
function firstIncompleteStep(p: Profile) {
  if (!p.gender || !p.birthDate) return 0;
  if (!p.degree || !p.course || !findSpecialty(p.university, p.faculty, p.specialty)) return 1;
  if (!p.photos.length) return 2;
  if (!habitsComplete(p.habits)) return 3;
  return 4;
}

export function Onboarding() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Logged-in users only; a finished profile goes straight to the app.
  useEffect(() => {
    if (!getToken()) return router.replace("/login");
    Promise.all([authApi.me(), profileApi.get()])
      .then(([user, p]) => {
        if (p.onboarded) return router.replace("/app");
        setEmail(user.email);
        setProfile(p);
        setStep(firstIncompleteStep(p));
      })
      .catch(() => {
        clearToken();
        router.replace("/login");
      });
    return () => {
      setProfile(null);
      setDone(false);
    };
  }, [router]);

  function go(next: number) {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
    // move focus to the new step title for keyboard / screen reader users
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  async function onSaved(p: Profile) {
    setProfile(p);
    if (step < STEPS.length - 1) return go(step + 1);

    if (!p.onboarded) {
      // something is still missing (e.g. a photo was deleted elsewhere) — send them there
      return go(firstIncompleteStep(p));
    }
    setDone(true);
    await wait(1600);
    router.push("/app");
  }

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

  const props = { profile, onSaved, onBack: step > 0 ? () => go(step - 1) : undefined };
  const lookingDone = lookingComplete(profile.looking);

  return (
    <div className="flex min-h-dvh flex-col bg-mint-tint/60">
      {done && <SuccessOverlay title="Анкету готово!" text="Тепер можна шукати сусіда" />}

      <header className="mx-auto flex h-[60px] w-full max-w-6xl items-center justify-between px-4 sm:h-[72px] sm:px-6">
        <Brand size={36} href="/onboarding" />
        <Button variant="outline" onClick={logout} className="px-4 py-2 text-sm">
          Вийти
        </Button>
      </header>

      <main className="flex flex-1 justify-center px-4 pb-12 pt-4 sm:pt-8">
        <div className="w-full max-w-xl">
          {/* Progress */}
          <div className="mb-5" aria-label={`Крок ${step + 1} з ${STEPS.length}`}>
            <div className="flex justify-between text-sm font-medium">
              <span className="text-mint-dark">
                Крок {step + 1} з {STEPS.length}
              </span>
              <span className="text-muted">{STEPS[step].title}</span>
            </div>
            <ol className="mt-2 grid grid-cols-5 gap-2">
              {STEPS.map((s, i) => (
                <li key={s.title} className="h-2 overflow-hidden rounded-full bg-line">
                  <span
                    className="block h-full rounded-full bg-mint transition-all duration-500"
                    style={{ width: i < step || (i === STEPS.length - 1 && lookingDone && done) ? "100%" : i === step ? "50%" : "0%" }}
                  />
                  <span className="sr-only">
                    {s.title}: {i < step ? "готово" : i === step ? "зараз" : "далі"}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div key={step} className="animate-rise rounded-3xl bg-white p-6 shadow-float sm:p-10">
            <h1 ref={headingRef} tabIndex={-1} className="font-display text-2xl font-bold outline-none sm:text-3xl">
              {STEPS[step].title}
            </h1>
            <p className="mb-6 mt-2 text-body">{STEPS[step].subtitle}</p>

            {step === 0 && <StepAbout {...props} />}
            {step === 1 && <StepStudy {...props} universityName={universityName(email)} />}
            {step === 2 && <StepPhotos {...props} />}
            {step === 3 && <StepHabits {...props} />}
            {step === 4 && <StepLooking {...props} />}
          </div>
        </div>
      </main>
    </div>
  );
}
