// Onboarding options (UA labels) and checks — same rules as backend/src/profile/dto.
import type { Habits, Looking } from "./api";
import { UNIVERSITIES } from "./universities";

export const MAX_PHOTOS = 4;
export const MAX_PHOTO_MB = 5;

export const GENDER_OPTIONS = [
  { value: "male", label: "Хлопець" },
  { value: "female", label: "Дівчина" },
] as const;

export const COURSE_OPTIONS = [1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) }));

export const SLEEP_OPTIONS = [
  { value: "early", label: "Рано лягаю", hint: "до 23:00" },
  { value: "late", label: "Пізно лягаю", hint: "після опівночі" },
  { value: "flexible", label: "По-різному" },
] as const;

export const CLEAN_OPTIONS = [
  { value: 1, label: "1", hint: "Мені байдуже" },
  { value: 2, label: "2", hint: "Прибираю зрідка" },
  { value: 3, label: "3", hint: "Звичайний порядок" },
  { value: 4, label: "4", hint: "Люблю чистоту" },
  { value: 5, label: "5", hint: "Ідеальний порядок" },
] as const;

export const SMOKING_OPTIONS = [
  { value: false, label: "Не курю" },
  { value: true, label: "Курю" },
] as const;

export const GUESTS_OPTIONS = [
  { value: "never", label: "Майже ніколи" },
  { value: "rarely", label: "Іноді" },
  { value: "often", label: "Часто" },
] as const;

export const ROOMMATE_OPTIONS = [
  { value: "male", label: "Хлопця" },
  { value: "female", label: "Дівчину" },
  { value: "any", label: "Неважливо" },
] as const;

export const HOUSING_OPTIONS = [
  { value: "dorm", label: "Гуртожиток" },
  { value: "flat", label: "Квартира" },
  { value: "any", label: "Будь-що" },
] as const;

export function universityName(email: string) {
  const domain = email.split("@")[1];
  return UNIVERSITIES.find((u) => u.domain === domain)?.name ?? "Твій виш";
}

// Date of birth — same rules as backend/src/profile/age.ts
export const MIN_AGE = 16;
export const MAX_AGE = 60;

export const MONTHS = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];

export function ageFrom(y: number, m: number, d: number, today = new Date()) {
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
  return age;
}

/** 1 рік, 2 роки, 5 років, 11 років, 21 рік */
export function yearsWord(n: number) {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return "рік";
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return "роки";
  return "років";
}

export const daysInMonth = (y: number, m: number) => new Date(y || 2000, m, 0).getDate();

/** Parts are strings from the selects ("" = not chosen). Returns an error text or undefined. */
export function validateBirth(d: string, m: string, y: string) {
  if (!d || !m || !y) return "Вкажи день, місяць і рік народження";
  const [dd, mm, yy] = [Number(d), Number(m), Number(y)];
  if (dd > daysInMonth(yy, mm)) return "Такої дати не існує — перевір день і місяць";
  const age = ageFrom(yy, mm, dd);
  if (age < MIN_AGE || age > MAX_AGE) return `Roomie — для студентів від ${MIN_AGE} до ${MAX_AGE} років`;
}

export const toIsoDate = (d: string, m: string, y: string) => `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;

export function validateBudget(from: string, to: string): { from?: string; to?: string } {
  const errs: { from?: string; to?: string } = {};
  const check = (v: string) => {
    if (!v.trim()) return "Вкажи суму";
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0) return "Ціле число, грн";
    if (n > 100_000) return "До 100 000 грн";
  };
  errs.from = check(from);
  errs.to = check(to);
  if (!errs.from && !errs.to && Number(from) > Number(to)) errs.to = "«До» має бути не менше, ніж «від»";
  return errs;
}

export const habitsComplete = (h: Habits | null) =>
  !!h && h.sleep !== undefined && h.clean !== undefined && h.smoking !== undefined && h.guests !== undefined;

export const lookingComplete = (l: Looking | null) => !!l && !!l.roommateGender && !!l.housing && !!l.budget;

/**
 * Shrinks a photo in the browser before upload (max 1600 px, JPEG): big phone photos fit the 5 MB limit
 * and upload faster. Safari also decodes HEIC this way.
 */
export async function shrinkImage(file: File, maxSide = 1600): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Це не схоже на фото. Підходять JPG, PNG або WEBP");
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.88));
  if (!blob) throw new Error("Не вдалося обробити фото");
  if (blob.size > MAX_PHOTO_MB * 1024 * 1024) throw new Error(`Фото завелике — максимум ${MAX_PHOTO_MB} МБ`);
  return blob;
}
