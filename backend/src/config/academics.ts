// Faculties → specialties → programs of the allowed universities.
// Generated from the official 2025 admission lists (vstup.osvita.ua); the same file is in frontend/src/lib.
import data from './academics.json';

export type Specialty = { name: string; programs: string[] };
export type Faculty = { name: string; short?: string; specialties: Specialty[] };

const UNIS = data as unknown as Record<string, Faculty[]>;

export const DEGREES = ['bachelor', 'master', 'phd'] as const;
export type Degree = (typeof DEGREES)[number];

/** Highest course for a degree. Medicine / dentistry / pharmacy (ЛНМУ) is a 5–6-year master's. */
export function maxCourse(degree: Degree, university: string): number {
  if (degree === 'master') return university === 'lnmu' ? 6 : 2;
  return 4;
}

export const facultiesOf = (university: string): Faculty[] => UNIS[university] ?? [];
export const findFaculty = (university: string, name: string) => facultiesOf(university).find((f) => f.name === name);
export const findSpecialty = (university: string, faculty: string, name: string) =>
  findFaculty(university, faculty)?.specialties.find((s) => s.name === name);
