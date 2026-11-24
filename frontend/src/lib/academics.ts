// Faculties → specialties → programs of the allowed universities (official 2025 admission lists,
// vstup.osvita.ua). The same file is used by the backend: backend/src/config/academics.json.
import data from "./academics.json";

export type Specialty = { name: string; programs: string[] };
export type Faculty = { name: string; short?: string; specialties: Specialty[] };
export type Degree = "bachelor" | "master" | "phd";

const UNIS = data as unknown as Record<string, Faculty[]>;

export const DEGREE_OPTIONS = [
  { value: "bachelor", label: "Бакалавр" },
  { value: "master", label: "Магістр" },
  { value: "phd", label: "PhD", hint: "Доктор філософії, аспірантура" },
] as const;

export const DEGREE_LABEL: Record<Degree, string> = { bachelor: "бакалаврат", master: "магістратура", phd: "аспірантура" };

/** Highest course for a degree. Medicine / dentistry / pharmacy (ЛНМУ) is a 5–6-year master's. */
export function maxCourse(degree: Degree | undefined, university: string) {
  if (degree === "master") return university === "lnmu" ? 6 : 2;
  return 4;
}

export const facultiesOf = (university: string): Faculty[] => UNIS[university] ?? [];
export const findFaculty = (university: string, name?: string | null) =>
  facultiesOf(university).find((f) => f.name === name);
export const findSpecialty = (university: string, faculty?: string | null, name?: string | null) =>
  findFaculty(university, faculty)?.specialties.find((s) => s.name === name);

/** Case-, apostrophe- and spacing-insensitive text for search. */
export const normalize = (s: string) =>
  s.toLowerCase().replace(/[’'`ʼ]/g, "").replace(/ё/g, "е").replace(/\s+/g, " ").trim();
