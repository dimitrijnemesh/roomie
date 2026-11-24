export interface University {
  code: string;
  name: string;
  emailDomains: string[];
}

export const UNIVERSITIES: University[] = [
  { code: 'lpnu', name: 'Львівська політехніка', emailDomains: ['lpnu.ua', 'edu.lpnu.ua'] },
  { code: 'lnu', name: 'ЛНУ ім. Івана Франка', emailDomains: ['lnu.edu.ua'] },
  { code: 'ldufk', name: 'ЛДУФК', emailDomains: ['ldufk.edu.ua'] },
  { code: 'lnmu', name: 'ЛНМУ ім. Данила Галицького', emailDomains: ['meduniv.lviv.ua'] },
];

export function universityByEmail(email: string): University | undefined {
  const domain = email.split('@')[1];
  return UNIVERSITIES.find((u) => u.emailDomains.includes(domain));
}
