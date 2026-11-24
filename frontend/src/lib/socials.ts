// Roomie's social accounts. To show a new one on the site, set its url (leave null to hide it).
export const SOCIALS = [
  { id: "x", label: "X (Twitter)", handle: "@roomie_ua", url: "https://x.com/roomie_ua" },
  { id: "instagram", label: "Instagram", handle: "", url: null },
  { id: "telegram", label: "Telegram", handle: "", url: null },
  { id: "tiktok", label: "TikTok", handle: "", url: null },
  { id: "email", label: "Пошта", handle: "roomie.ua@gmail.com", url: "mailto:roomie.ua@gmail.com" },
] as const;

export type SocialId = (typeof SOCIALS)[number]["id"];
