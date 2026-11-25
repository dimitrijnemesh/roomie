"use client";

import { useEffect, useRef, useState } from "react";
import { PageLoading, useApp } from "@/components/AppShell";
import { ProfileCard } from "@/components/ProfileCard";
import { Alert, Button, Field } from "@/components/ui";
import { DEGREE_LABEL, findFaculty } from "@/lib/academics";
import { ApiError, authApi, profileApi, type Profile } from "@/lib/api";
import {
  CLEAN_OPTIONS,
  GENDER_OPTIONS,
  GUESTS_OPTIONS,
  HOUSING_OPTIONS,
  MONTHS,
  ROOMMATE_OPTIONS,
  SLEEP_OPTIONS,
  universityName,
  yearsWord,
} from "@/lib/profile";
import { shake } from "@/lib/motion";
import { validateName } from "@/lib/validation";
import { StepAbout, StepHabits, StepLooking, StepPhotos, StepStudy } from "../../onboarding/steps";

type Section = "name" | "about" | "study" | "photos" | "habits" | "looking";

const label = <T,>(opts: readonly { value: T; label: string }[], v: T | undefined) => opts.find((o) => o.value === v)?.label;

function birthText(iso?: string | null, age?: number | null) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}${age !== null && age !== undefined ? ` (${age} ${yearsWord(age)})` : ""}`;
}

/** «Моя анкета»: the card as others see it + every block can be edited with the onboarding forms. */
export function MyProfile() {
  const app = useApp();
  const [editing, setEditing] = useState<Section | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2200);
    return () => clearTimeout(t);
  }, [saved]);

  if (!app) return <PageLoading />;
  const { user, profile, setProfile, setUser } = app;

  function done(p: Profile) {
    setProfile(p);
    setEditing(null);
    setSaved(true);
  }

  // Photos are uploaded / deleted right away, even if the editor is closed with «Скасувати».
  async function closePhotos() {
    setEditing(null);
    setProfile(await profileApi.get().catch(() => profile));
  }

  const h = profile.habits ?? {};
  const l = profile.looking ?? {};
  const edit = { submitLabel: "Зберегти", backLabel: "Скасувати", onSaved: done, onBack: () => setEditing(null), profile };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="animate-rise">
        <p className="text-xs font-bold uppercase tracking-[2px] text-mint-dark">Профіль</p>
        <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Моя анкета</h1>
        <p className="mt-2 text-body">Зміни зберігаються одразу, а картка «Так тебе бачать інші» оновлюється разом із ними.</p>
      </div>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-4">
          <Block title="Ім’я" section="name" editing={editing} onEdit={setEditing} summary={user.name}>
            <NameForm
              name={user.name}
              onCancel={() => setEditing(null)}
              onSaved={(name) => {
                setUser({ ...user, name });
                done({ ...profile, name });
              }}
            />
          </Block>

          <Block
            title="Про мене"
            section="about"
            editing={editing}
            onEdit={setEditing}
            summary={
              <>
                {label(GENDER_OPTIONS, profile.gender ?? undefined)} · {birthText(profile.birthDate, profile.age)}
                {profile.bio && <span className="mt-1 block text-muted">{profile.bio}</span>}
              </>
            }
          >
            <StepAbout {...edit} />
          </Block>

          <Block
            title="Навчання"
            section="study"
            editing={editing}
            onEdit={setEditing}
            summary={
              <>
                {findFaculty(profile.university, profile.faculty)?.short ?? profile.faculty} · {profile.specialty}
                <span className="mt-1 block text-muted">
                  {profile.course} курс, {profile.degree ? DEGREE_LABEL[profile.degree] : ""}
                  {profile.specialization ? ` · ${profile.specialization}` : ""}
                </span>
              </>
            }
          >
            <StepStudy {...edit} universityName={universityName(user.email)} />
          </Block>

          <Block
            title="Фото"
            section="photos"
            editing={editing}
            onEdit={setEditing}
            summary={
              <span className="mt-1 flex gap-2">
                {profile.photos.map((p, i) => (
                  // eslint-disable-next-line @next/next/no-img-element -- user uploads from the API host
                  <img key={p.id} src={p.url} alt={i === 0 ? "Головне фото" : `Фото ${i + 1}`} className="size-14 rounded-xl object-cover" />
                ))}
              </span>
            }
          >
            <StepPhotos {...edit} onBack={closePhotos} />
          </Block>

          <Block
            title="Звички"
            section="habits"
            editing={editing}
            onEdit={setEditing}
            summary={[
              label(SLEEP_OPTIONS, h.sleep),
              CLEAN_OPTIONS.find((o) => o.value === h.clean)?.hint,
              h.smoking ? "курю" : "не курю",
              `гості — ${label(GUESTS_OPTIONS, h.guests)?.toLowerCase()}`,
            ].join(" · ")}
          >
            <StepHabits {...edit} />
          </Block>

          <Block
            title="Що шукаю"
            section="looking"
            editing={editing}
            onEdit={setEditing}
            summary={[
              label(ROOMMATE_OPTIONS, l.roommateGender),
              label(HOUSING_OPTIONS, l.housing)?.toLowerCase(),
              l.budget && `${l.budget[0]}–${l.budget[1]} грн`,
              l.district,
            ]
              .filter(Boolean)
              .join(" · ")}
          >
            <StepLooking {...edit} />
          </Block>
        </div>

        <aside className="lg:sticky lg:top-24" aria-label="Так тебе бачать інші">
          <p className="mb-3 text-sm font-medium text-muted">Так тебе бачать інші</p>
          <ProfileCard profile={profile} />
        </aside>
      </div>

      {saved && (
        <p
          role="status"
          className="fixed inset-x-0 bottom-24 z-40 mx-auto flex w-fit animate-pop items-center gap-2 rounded-full bg-ink px-5 py-3 font-medium text-white shadow-float sm:bottom-8"
        >
          <svg className="size-5 text-mint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          Збережено
        </p>
      )}
    </main>
  );
}

/** One block of the profile: title + summary, or the edit form when it's open. */
function Block({
  title,
  section,
  editing,
  onEdit,
  summary,
  children,
}: {
  title: string;
  section: Section;
  editing: Section | null;
  onEdit: (s: Section) => void;
  summary: React.ReactNode;
  children: React.ReactNode;
}) {
  const open = editing === section;
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Opening a block moves focus into it, so keyboard users land on the form.
  useEffect(() => {
    if (open) headingRef.current?.focus();
  }, [open]);

  return (
    <section className={`rounded-3xl bg-white p-5 shadow-float transition-shadow sm:p-6 ${open ? "ring-2 ring-mint" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 ref={headingRef} tabIndex={-1} className="font-display text-lg font-bold outline-none">
            {title}
          </h2>
          {!open && <div className="mt-1 text-body">{summary}</div>}
        </div>
        {!open && (
          <Button
            variant="outline"
            onClick={() => onEdit(section)}
            disabled={editing !== null}
            className="shrink-0 px-4 py-2 text-sm"
            aria-label={`Редагувати: ${title}`}
          >
            Редагувати
          </Button>
        )}
      </div>
      {open && <div className="mt-5 animate-fade-in">{children}</div>}
    </section>
  );
}

function NameForm({ name, onSaved, onCancel }: { name: string; onSaved: (name: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string>();
  const [serverError, setServerError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateName(value);
    if (err) {
      setError(err);
      shake(formRef.current?.querySelector("input"));
      return;
    }
    setLoading(true);
    try {
      const user = await authApi.updateMe({ name: value.trim() });
      onSaved(user.name);
    } catch (e) {
      setLoading(false);
      if (e instanceof ApiError && e.field === "name") return setError(e.message);
      setServerError(e instanceof ApiError ? e.message : "Не вдалося зберегти, спробуй ще раз");
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {serverError && <Alert>{serverError}</Alert>}
      <Field
        id="name"
        label="Як тебе звати"
        autoComplete="given-name"
        value={value}
        error={error}
        onChange={(e) => {
          setValue(e.target.value);
          setError(undefined);
        }}
      />
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="px-5 py-3.5">
          Скасувати
        </Button>
        <Button type="submit" loading={loading} className="flex-1 py-3.5 text-lg">
          {loading ? "Зберігаємо…" : "Зберегти"}
        </Button>
      </div>
    </form>
  );
}
