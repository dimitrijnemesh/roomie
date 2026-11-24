// Same rules as the backend DTOs (backend/src/auth/dto). The backend always re-checks.
import { isStudentEmail } from "./universities";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (v: string) => v.trim().toLowerCase();

export function validateEmail(value: string): string | undefined {
  const v = normalizeEmail(value);
  if (!v) return "Введи пошту";
  if (!EMAIL_RE.test(v) || v.length > 254) return "Це не схоже на пошту — перевір, будь ласка";
  if (!isStudentEmail(v)) return "Потрібна студентська пошта львівського університету";
}

export const PASSWORD_RULES = [
  { id: "length", label: "Мінімум 8 символів", test: (v: string) => v.length >= 8 && v.length <= 72 },
  { id: "letter", label: "Літера", test: (v: string) => /\p{L}/u.test(v) },
  { id: "digit", label: "Цифра", test: (v: string) => /\d/.test(v) },
  { id: "special", label: "Спецсимвол (!, ?, # …)", test: (v: string) => /[^\p{L}\d\s]/u.test(v) },
] as const;

export function validateNewPassword(value: string): string | undefined {
  if (!value) return "Придумай пароль";
  if (value.length > 72) return "Максимум 72 символи";
  if (!PASSWORD_RULES.every((r) => r.test(value))) return "Мінімум 8 символів: літера, цифра і спецсимвол";
}

export function validatePasswordRepeat(password: string, repeat: string): string | undefined {
  if (!repeat) return "Повтори пароль";
  if (password !== repeat) return "Паролі не збігаються";
}

export function validateName(value: string): string | undefined {
  const v = value.trim();
  if (!v) return "Як тебе звати?";
  if (v.length < 2 || v.length > 40 || !/^[\p{L}\s’'-]+$/u.test(v)) return "Ім’я — від 2 до 40 літер";
}

export function validateLoginPassword(value: string): string | undefined {
  if (!value) return "Введи пароль";
}

// Typos like "lpnu.com" / "lnu.edu.au" → suggest the closest allowed domain.
function distance(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

export function suggestEmail(value: string, domains: readonly string[]): string | undefined {
  const v = normalizeEmail(value);
  const [local, domain] = v.split("@");
  if (!local || !domain || domains.includes(domain)) return;
  let best: string | undefined;
  let bestScore = Infinity;
  for (const d of domains) {
    const score = distance(domain, d);
    if (score < bestScore) [best, bestScore] = [d, score];
  }
  // close enough, or the same first word ("lpnu.com" → "lpnu.ua")
  if (best && (bestScore <= 3 || domain.split(".")[0] === best.split(".")[0])) return `${local}@${best}`;
}
