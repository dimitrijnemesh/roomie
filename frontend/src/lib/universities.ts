// Lviv universities whose corporate emails can sign up.
// Backend must use the same list (see README §4 validation).
export const UNIVERSITIES = [
  { name: "Львівська політехніка", domain: "lpnu.ua" },
  { name: "Львівська політехніка (Outlook)", domain: "edu.lpnu.ua" },
  { name: "ЛНУ ім. Івана Франка", domain: "lnu.edu.ua" },
  { name: "ЛДУФК", domain: "ldufk.edu.ua" },
  { name: "ЛНМУ ім. Данила Галицького", domain: "meduniv.lviv.ua" },
] as const;

export const EMAIL_PLACEHOLDER = "ivan.petrenko@lnu.edu.ua";
