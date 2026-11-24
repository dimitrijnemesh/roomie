"use client";

import { useRef, useState } from "react";
import { ChoiceChips } from "@/components/ChoiceChips";
import { Alert, Button, Field, FieldError, Spinner, inputClass } from "@/components/ui";
import { ApiError, profileApi, type Habits, type Looking, type Photo, type Profile } from "@/lib/api";
import { shake } from "@/lib/motion";
import {
  CLEAN_OPTIONS,
  COURSE_OPTIONS,
  GENDER_OPTIONS,
  GUESTS_OPTIONS,
  HOUSING_OPTIONS,
  MAX_PHOTOS,
  MAX_PHOTO_MB,
  ROOMMATE_OPTIONS,
  SLEEP_OPTIONS,
  SMOKING_OPTIONS,
  MAX_AGE,
  MIN_AGE,
  MONTHS,
  ageFrom,
  daysInMonth,
  shrinkImage,
  toIsoDate,
  validateBirth,
  yearsWord,
  validateBudget,
} from "@/lib/profile";
import { Combobox, type ComboOption } from "@/components/Combobox";
import { DEGREE_OPTIONS, type Degree, facultiesOf, findFaculty, findSpecialty, maxCourse } from "@/lib/academics";

export type StepProps = {
  profile: Profile;
  onSaved: (p: Profile) => void;
  onBack?: () => void;
  last?: boolean;
};

type Errors = Record<string, string | undefined>;

/** Shake + focus the first invalid field inside a form. */
function showInvalid(form: HTMLFormElement | null, errors: Errors) {
  const keys = Object.keys(errors).filter((k) => errors[k]);
  keys.forEach((k) => shake(form?.querySelector(`[data-field="${k}"]`)));
  form?.querySelector<HTMLElement>(`[data-field="${keys[0]}"] input, [data-field="${keys[0]}"] select, [data-field="${keys[0]}"] textarea, [data-field="${keys[0]}"] [role=radio]`)?.focus();
  return keys.length === 0;
}

function StepNav({ onBack, loading, last }: { onBack?: () => void; loading: boolean; last?: boolean }) {
  return (
    <div className="mt-8 flex gap-3">
      {onBack && (
        <Button type="button" variant="outline" onClick={onBack} disabled={loading} className="px-5 py-3.5">
          Назад
        </Button>
      )}
      <Button type="submit" loading={loading} className="flex-1 py-3.5 text-lg">
        {loading ? "Зберігаємо…" : last ? "Готово" : "Далі"}
      </Button>
    </div>
  );
}

/** Saves a step; maps server field errors back onto the step's fields. */
async function save(
  body: Parameters<typeof profileApi.update>[0],
  setErrors: (e: Errors) => void,
  setFormError: (m?: string) => void,
): Promise<Profile | null> {
  try {
    return await profileApi.update(body);
  } catch (err) {
    const e = err instanceof ApiError ? err : null;
    if (e?.field) setErrors({ [e.field]: e.message });
    else setFormError(e?.message ?? "Не вдалося зберегти, спробуй ще раз");
    return null;
  }
}

// ---------- 1. Про мене ----------

export function StepAbout({ profile, onSaved }: StepProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [gender, setGender] = useState(profile.gender ?? undefined);
  const [bd, bm, by] = profile.birthDate ? profile.birthDate.split("-").reverse().map((x) => String(Number(x))) : ["", "", ""];
  const [day, setDay] = useState(bd);
  const [month, setMonth] = useState(bm);
  const [year, setYear] = useState(by);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(undefined);
    const next: Errors = {
      gender: gender ? undefined : "Обери один варіант",
      birthDate: validateBirth(day, month, year),
      bio: bio.trim().length > 300 ? "До 300 символів" : undefined,
    };
    setErrors(next);
    if (!showInvalid(formRef.current, next)) return;

    setLoading(true);
    const p = await save({ gender, birthDate: toIsoDate(day, month, year), bio: bio.trim() }, setErrors, setFormError);
    setLoading(false);
    if (p) onSaved(p);
  }

  const clear = (k: string) => setErrors((prev) => ({ ...prev, [k]: undefined }));

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {formError && <Alert>{formError}</Alert>}

      <ChoiceChips
        id="gender"
        label="Стать"
        options={GENDER_OPTIONS}
        value={gender}
        onChange={(v) => (setGender(v), clear("gender"))}
        error={errors.gender}
      />

      <BirthDateField
        day={day}
        month={month}
        year={year}
        onChange={(d, m, y) => {
          setDay(d);
          setMonth(m);
          setYear(y);
          clear("birthDate");
        }}
        error={errors.birthDate}
      />

      <div className="flex flex-col gap-1.5" data-field="bio">
        <div className="flex items-baseline justify-between">
          <label htmlFor="bio" className="text-sm font-medium text-body">
            Про себе <span className="font-normal text-muted">(необов’язково)</span>
          </label>
          <span className={`text-xs tabular-nums ${bio.length > 300 ? "text-warning" : "text-muted"}`}>{bio.length}/300</span>
        </div>
        <textarea
          id="bio"
          rows={3}
          placeholder="Напр. Люблю готувати, вечорами граю на гітарі"
          value={bio}
          onChange={(e) => (setBio(e.target.value), clear("bio"))}
          aria-invalid={!!errors.bio || undefined}
          className={`${inputClass(!!errors.bio)} h-auto resize-none py-3`}
        />
        <FieldError id="bio-error">{errors.bio}</FieldError>
      </div>

      <StepNav loading={loading} />
    </form>
  );
}

function Chevron() {
  return (
    <svg className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** Day / month / year selects + live «Тобі 18 років». Years limited to the allowed age range. */
function BirthDateField({
  day,
  month,
  year,
  onChange,
  error,
}: {
  day: string;
  month: string;
  year: string;
  onChange: (d: string, m: string, y: string) => void;
  error?: string;
}) {
  const now = new Date().getFullYear();
  const years = Array.from({ length: MAX_AGE - MIN_AGE + 2 }, (_, i) => String(now - MIN_AGE - i + 1)).filter(
    (y) => Number(y) <= now - MIN_AGE,
  );
  const maxDay = month ? daysInMonth(Number(year), Number(month)) : 31;
  const age = day && month && year && Number(day) <= maxDay ? ageFrom(Number(year), Number(month), Number(day)) : null;
  const select = (invalid: boolean) => `${inputClass(invalid)} w-full cursor-pointer appearance-none pr-9`;
  return (
    <fieldset className="flex flex-col gap-1.5" data-field="birthDate" aria-describedby={error ? "birthDate-error" : undefined}>
      <legend className="mb-1.5 text-sm font-medium text-body">Дата народження</legend>
      <div className="grid grid-cols-[1fr_1.6fr_1.2fr] gap-2">
        <div className="relative">
          <select aria-label="День" value={day} onChange={(e) => onChange(e.target.value, month, year)} className={select(!!error && !day)}>
            <option value="">День</option>
            {Array.from({ length: maxDay }, (_, i) => String(i + 1)).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <Chevron />
        </div>
        <div className="relative">
          <select
            aria-label="Місяць"
            value={month}
            onChange={(e) => {
              const m = e.target.value;
              // 31 → February: keep the date real
              const fix = day && m && Number(day) > daysInMonth(Number(year), Number(m)) ? String(daysInMonth(Number(year), Number(m))) : day;
              onChange(fix, m, year);
            }}
            className={select(!!error && !month)}
          >
            <option value="">Місяць</option>
            {MONTHS.map((name, i) => (
              <option key={name} value={String(i + 1)}>{name}</option>
            ))}
          </select>
          <Chevron />
        </div>
        <div className="relative">
          <select
            aria-label="Рік"
            value={year}
            onChange={(e) => {
              const y = e.target.value;
              const fix = day && month && Number(day) > daysInMonth(Number(y), Number(month)) ? String(daysInMonth(Number(y), Number(month))) : day;
              onChange(fix, month, y);
            }}
            className={select(!!error && !year)}
          >
            <option value="">Рік</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Chevron />
        </div>
      </div>
      {age !== null && !error && (
        <p className="animate-fade-in text-sm text-muted">
          Тобі {age} {yearsWord(age)} — вік оновлюватиметься сам
        </p>
      )}
      <FieldError id="birthDate-error">{error}</FieldError>
    </fieldset>
  );
}

// ---------- 2. Навчання ----------

export function StepStudy({ profile, onSaved, onBack, universityName }: StepProps & { universityName: string }) {
  const uni = profile.university;
  const formRef = useRef<HTMLFormElement>(null);
  const [degree, setDegree] = useState<Degree | undefined>((profile.degree as Degree) ?? undefined);
  const [course, setCourse] = useState(profile.course ?? undefined);
  // keep only values that exist in the list (old free-text answers must be picked again)
  const [faculty, setFaculty] = useState(findFaculty(uni, profile.faculty)?.name ?? "");
  const [specialty, setSpecialty] = useState(findSpecialty(uni, profile.faculty, profile.specialty)?.name ?? "");
  const [specialization, setSpecialization] = useState(profile.specialization ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const clear = (k: string) => setErrors((prev) => ({ ...prev, [k]: undefined }));
  const faculties = facultiesOf(uni);
  const fac = findFaculty(uni, faculty);
  const spec = findSpecialty(uni, faculty, specialty);
  const courses = COURSE_OPTIONS.slice(0, maxCourse(degree, uni));

  const facultyOptions: ComboOption[] = faculties.map((f) => ({
    value: f.name,
    label: f.name,
    hint: f.short,
    keywords: f.specialties.map((s) => s.name).join(" "), // "комп’ютерні" also finds the faculty
  }));
  const specialtyOptions: ComboOption[] = (fac?.specialties ?? []).map((s) => ({ value: s.name, label: s.name }));
  const programOptions: ComboOption[] = (spec?.programs ?? []).map((p) => ({ value: p, label: p }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(undefined);
    const next: Errors = {
      degree: degree ? undefined : "Обери ступінь",
      course: course ? undefined : "Обери курс",
      faculty: fac ? undefined : "Обери факультет зі списку",
      specialty: spec ? undefined : faculty ? "Обери спеціальність зі списку" : "Спершу обери факультет",
      specialization: specialization.length > 120 ? "До 120 символів" : undefined,
    };
    setErrors(next);
    if (!showInvalid(formRef.current, next)) return;

    setLoading(true);
    const p = await save({ degree, course, faculty, specialty, specialization: specialization.trim() }, setErrors, setFormError);
    setLoading(false);
    if (p) onSaved(p);
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {formError && <Alert>{formError}</Alert>}

      <div className="flex items-center gap-3 rounded-2xl bg-mint-tint px-4 py-3">
        <svg className="size-6 shrink-0 text-mint-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M22 10 12 5 2 10l10 5 10-5Z" />
          <path d="M6 12v5c3 2 9 2 12 0v-5" />
        </svg>
        <div>
          <p className="font-medium text-ink">{universityName}</p>
          <p className="text-sm text-muted">Визначили за твоєю поштою</p>
        </div>
      </div>

      <ChoiceChips
        id="degree"
        label="Ступінь"
        options={DEGREE_OPTIONS}
        value={degree}
        onChange={(v) => {
          setDegree(v);
          clear("degree");
          if (course && course > maxCourse(v, uni)) setCourse(undefined); // e.g. 4th year → master's has 1–2
        }}
        error={errors.degree}
      />

      <ChoiceChips
        id="course"
        label="Курс"
        options={courses}
        columns={Math.max(courses.length, 4)}
        value={course}
        onChange={(v) => (setCourse(v), clear("course"))}
        error={errors.course}
      />

      <Combobox
        id="faculty"
        label="Факультет / інститут"
        placeholder={faculties.find((f) => f.short) ? `Почни вводити, напр. ${faculties.find((f) => f.short)!.short} або «економ»` : "Почни вводити, напр. «економ» або «право»"}
        options={facultyOptions}
        value={faculty}
        onChange={(v) => {
          setFaculty(v);
          clear("faculty");
          if (v !== faculty) {
            setSpecialty("");
            setSpecialization("");
          }
        }}
        error={errors.faculty}
      />

      <Combobox
        id="specialty"
        label="Спеціальність"
        placeholder={faculty ? "Пошук спеціальності" : "Спершу обери факультет"}
        options={specialtyOptions}
        value={specialty}
        disabled={!fac}
        onChange={(v) => {
          setSpecialty(v);
          clear("specialty");
          if (v !== specialty) setSpecialization("");
        }}
        error={errors.specialty}
      />

      <Combobox
        id="specialization"
        label="Спеціалізація / освітня програма"
        optional
        placeholder={spec ? (programOptions.length ? "Обери або впиши свою" : "Впиши, якщо є") : "Спершу обери спеціальність"}
        options={programOptions}
        value={specialization}
        disabled={!spec}
        allowCustom
        emptyText="Впиши назву своєї програми"
        onChange={(v) => (setSpecialization(v), clear("specialization"))}
        error={errors.specialization}
      />

      <StepNav onBack={onBack} loading={loading} />
    </form>
  );
}

// ---------- 3. Фото ----------

type Slot = { kind: "photo"; photo: Photo } | { kind: "uploading"; key: string; preview: string };

export function StepPhotos({ profile, onSaved, onBack }: StepProps) {
  const [photos, setPhotos] = useState<Photo[]>(profile.photos);
  const [uploading, setUploading] = useState<{ key: string; preview: string }[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const free = MAX_PHOTOS - photos.length - uploading.length;

  async function addFiles(files: FileList | File[]) {
    setError(undefined);
    const list = Array.from(files).slice(0, Math.max(free, 0));
    if (Array.from(files).length > list.length) setError(`Максимум ${MAX_PHOTOS} фото`);

    // One at a time keeps order and positions predictable.
    for (const file of list) {
      const key = crypto.randomUUID();
      const preview = URL.createObjectURL(file);
      setUploading((u) => [...u, { key, preview }]);
      try {
        const blob = await shrinkImage(file);
        setPhotos(await profileApi.addPhoto(blob));
      } catch (err) {
        setError(err instanceof Error ? err.message : `Не вдалося завантажити фото`);
        shake(gridRef.current);
      } finally {
        URL.revokeObjectURL(preview);
        setUploading((u) => u.filter((x) => x.key !== key));
      }
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    setError(undefined);
    try {
      setPhotos(await profileApi.deletePhoto(id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не вдалося видалити фото");
    }
    setBusyId(null);
  }

  async function makeMain(id: string) {
    setBusyId(id);
    try {
      setPhotos(await profileApi.reorderPhotos([id, ...photos.map((p) => p.id).filter((x) => x !== id)]));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не вдалося змінити головне фото");
    }
    setBusyId(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (uploading.length) return setError("Зачекай, фото ще завантажується");
    if (!photos.length) {
      setError("Додай хоча б одне фото — так тебе легше впізнати");
      shake(gridRef.current);
      return;
    }
    onSaved({ ...profile, photos });
  }

  const slots: Slot[] = [
    ...photos.map((photo) => ({ kind: "photo" as const, photo })),
    ...uploading.map((u) => ({ kind: "uploading" as const, ...u })),
  ];

  return (
    <form onSubmit={onSubmit} noValidate>
      <p className="text-body">
        Від 1 до {MAX_PHOTOS} фото, де добре видно обличчя. Перше — головне, його бачать у стрічці.
      </p>

      <div
        ref={gridRef}
        className={`mt-5 grid grid-cols-2 gap-3 rounded-3xl transition-colors ${dragOver ? "bg-mint-tint" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
      >
        {slots.map((s, i) => (
          <div key={s.kind === "photo" ? s.photo.id : s.key} className="relative aspect-[4/5] animate-fade-in overflow-hidden rounded-2xl bg-mint-tint">
            {/* eslint-disable-next-line @next/next/no-img-element -- user uploads from the API host */}
            <img
              src={s.kind === "photo" ? s.photo.url : s.preview}
              alt={i === 0 ? "Головне фото" : `Фото ${i + 1}`}
              className={`size-full object-cover ${s.kind === "uploading" ? "opacity-50 blur-[1px]" : ""}`}
            />
            {i === 0 && s.kind === "photo" && (
              <span className="absolute left-2 top-2 rounded-full bg-mint px-2.5 py-1 text-xs font-bold text-ink">Головне</span>
            )}
            {s.kind === "uploading" && (
              <div className="absolute inset-0 flex items-center justify-center text-ink" role="status" aria-label="Завантаження фото">
                <Spinner className="size-8" />
              </div>
            )}
            {s.kind === "photo" && (
              <div className="absolute inset-x-2 bottom-2 flex justify-between gap-2">
                {i > 0 ? (
                  <button
                    type="button"
                    onClick={() => makeMain(s.photo.id)}
                    disabled={!!busyId}
                    className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-ink shadow-float hover:bg-white disabled:opacity-50"
                  >
                    Зробити головним
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => remove(s.photo.id)}
                  disabled={!!busyId}
                  aria-label={`Видалити фото ${i + 1}`}
                  className="flex size-8 items-center justify-center rounded-full bg-white/90 text-ink shadow-float hover:bg-white hover:text-warning disabled:opacity-50"
                >
                  {busyId === s.photo.id ? (
                    <Spinner className="size-4" />
                  ) : (
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                      <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
        ))}

        {free > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-center transition-colors hover:border-mint hover:bg-mint-tint/60 ${
              error && !photos.length ? "border-warning bg-warning/5" : "border-line bg-white"
            }`}
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-mint text-ink">
              <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <span className="px-2 text-sm font-medium text-ink">{photos.length ? "Додати ще" : "Додати фото"}</span>
            <span className="hidden px-2 text-xs text-muted sm:block">або перетягни сюди</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="mt-3 min-h-5">
        <FieldError id="photos-error">{error}</FieldError>
      </div>
      <p className="text-xs text-muted">JPG, PNG або WEBP до {MAX_PHOTO_MB} МБ. Великі фото ми стиснемо самі.</p>

      <StepNav onBack={onBack} loading={uploading.length > 0} />
    </form>
  );
}

// ---------- 4. Звички ----------

export function StepHabits({ profile, onSaved, onBack }: StepProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [h, setH] = useState<Habits>(profile.habits ?? {});
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof Habits>(k: K, v: Habits[K]) => {
    setH((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(undefined);
    const pick = "Обери один варіант";
    const next: Errors = {
      sleep: h.sleep ? undefined : pick,
      clean: h.clean ? undefined : pick,
      smoking: h.smoking === undefined ? pick : undefined,
      guests: h.guests ? undefined : pick,
    };
    setErrors(next);
    if (!showInvalid(formRef.current, next)) return;

    setLoading(true);
    const p = await save({ habits: h }, (e) => setErrors({ ...e, habits: undefined }), setFormError);
    setLoading(false);
    if (p) onSaved(p);
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {formError && <Alert>{formError}</Alert>}
      <p className="text-body">Чесні відповіді — менше сварок потім. Це бачитимуть твої потенційні сусіди.</p>
      <ChoiceChips id="sleep" label="Режим сну" options={SLEEP_OPTIONS} value={h.sleep} onChange={(v) => set("sleep", v)} error={errors.sleep} />
      <ChoiceChips id="clean" label="Чистота" options={CLEAN_OPTIONS} value={h.clean} onChange={(v) => set("clean", v)} error={errors.clean} />
      <ChoiceChips id="smoking" label="Куріння" options={SMOKING_OPTIONS} value={h.smoking} onChange={(v) => set("smoking", v)} error={errors.smoking} />
      <ChoiceChips id="guests" label="Гості" options={GUESTS_OPTIONS} value={h.guests} onChange={(v) => set("guests", v)} error={errors.guests} />
      <StepNav onBack={onBack} loading={loading} />
    </form>
  );
}

// ---------- 5. Що шукаю ----------

export function StepLooking({ profile, onSaved, onBack }: StepProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const initial = profile.looking ?? {};
  const [roommate, setRoommate] = useState(initial.roommateGender);
  const [housing, setHousing] = useState(initial.housing);
  const [from, setFrom] = useState(initial.budget?.[0]?.toString() ?? "");
  const [to, setTo] = useState(initial.budget?.[1]?.toString() ?? "");
  const [district, setDistrict] = useState(initial.district ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const clear = (k: string) => setErrors((prev) => ({ ...prev, [k]: undefined }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(undefined);
    const budget = validateBudget(from, to);
    const next: Errors = {
      roommate: roommate ? undefined : "Обери один варіант",
      housing: housing ? undefined : "Обери один варіант",
      from: budget.from,
      to: budget.to,
      district: district.trim().length > 60 ? "До 60 символів" : undefined,
    };
    setErrors(next);
    if (!showInvalid(formRef.current, next)) return;

    const looking: Looking = {
      roommateGender: roommate,
      housing,
      budget: [Number(from), Number(to)],
      ...(district.trim() ? { district: district.trim() } : {}),
    };
    setLoading(true);
    const p = await save({ looking }, (e) => setErrors(e.looking ? { to: e.looking } : e), setFormError);
    setLoading(false);
    if (p) onSaved(p);
  }

  const money = (id: "from" | "to", label: string, value: string, set: (v: string) => void) => (
    <div className="flex-1">
      <Field
        id={id}
        label={label}
        inputMode="numeric"
        placeholder={id === "from" ? "2000" : "4000"}
        maxLength={6}
        value={value}
        onChange={(e) => (set(e.target.value.replace(/\D/g, "")), clear(id))}
        error={errors[id]}
      />
    </div>
  );

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {formError && <Alert>{formError}</Alert>}
      <ChoiceChips id="roommate" label="Шукаю в сусіди" options={ROOMMATE_OPTIONS} value={roommate} onChange={(v) => (setRoommate(v), clear("roommate"))} error={errors.roommate} />
      <ChoiceChips id="housing" label="Житло" options={HOUSING_OPTIONS} value={housing} onChange={(v) => (setHousing(v), clear("housing"))} error={errors.housing} />
      <div>
        <p className="mb-2 text-sm font-medium text-body">Бюджет на місяць, грн</p>
        <div className="flex gap-3">
          {money("from", "Від", from, setFrom)}
          {money("to", "До", to, setTo)}
        </div>
      </div>
      <Field
        id="district"
        label="Район (необов’язково)"
        placeholder="Напр. Сихів, центр, біля Політехніки"
        maxLength={60}
        value={district}
        onChange={(e) => (setDistrict(e.target.value), clear("district"))}
        error={errors.district}
      />
      <StepNav onBack={onBack} loading={loading} last />
    </form>
  );
}
