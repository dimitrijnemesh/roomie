import { SOCIALS, type SocialId } from "@/lib/socials";

const ICONS: Record<SocialId, React.ReactNode> = {
  x: <path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3Zm-1.08 16.17h1.7L7.4 4.74H5.58l11.1 14.43Z" fill="currentColor" />,
  instagram: (
    <g fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </g>
  ),
  telegram: <path d="M21.4 4.1 2.9 11.2c-1 .4-1 1.6 0 1.9l4.6 1.5 1.8 5.6c.2.7 1.1.9 1.6.4l2.6-2.4 4.7 3.5c.6.4 1.4.1 1.6-.6l3.1-14.7c.2-.9-.6-1.6-1.5-1.3ZM9.8 14.2l-.4 3.6-1.2-3.9 9.3-6.1-7.7 6.4Z" fill="currentColor" />,
  tiktok: <path d="M16.6 3c.4 2.2 1.8 3.7 4 3.9v3.1c-1.5 0-2.9-.4-4-1.2v6.4a6 6 0 1 1-6-6h.6v3.2a2.9 2.9 0 1 0 2.3 2.8V3h3.1Z" fill="currentColor" />,
  email: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </g>
  ),
};

/** Round social icons. `tone="dark"` for the ink footer, `"light"` for white/mint backgrounds. */
export function SocialLinks({ tone = "dark", className = "" }: { tone?: "dark" | "light"; className?: string }) {
  const style =
    tone === "dark"
      ? "bg-white/10 text-on-dark hover:bg-mint hover:text-ink"
      : "bg-mint-tint text-mint-dark hover:bg-mint hover:text-ink";

  return (
    <ul className={`flex flex-wrap gap-3 ${className}`} aria-label="Roomie у соцмережах">
      {SOCIALS.filter((s) => s.url).map((s) => (
        <li key={s.id}>
          <a
            href={s.url!}
            {...(s.url!.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            aria-label={`${s.label}${s.handle ? ` — ${s.handle}` : ""}`}
            title={s.handle || s.label}
            className={`flex size-11 items-center justify-center rounded-full transition-all hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mint ${style}`}
          >
            <svg className="size-5" viewBox="0 0 24 24" aria-hidden>
              {ICONS[s.id]}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
