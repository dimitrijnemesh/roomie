/** Allowed age range for students in Roomie. */
export const MIN_AGE = 16;
export const MAX_AGE = 60;

/** Full years between a date of birth and today (UTC dates, birthday counts on the day itself). */
export function ageFrom(birth: Date, today = new Date()): number {
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const m = today.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < birth.getUTCDate())) age--;
  return age;
}

/** Parses "YYYY-MM-DD" into a UTC date; null if it is not a real calendar date (e.g. 2007-02-30). */
export function parseBirthDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d ? date : null;
}
