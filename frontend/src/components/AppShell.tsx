"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { Brand, Spinner } from "@/components/ui";
import { authApi, profileApi, type Profile, type User } from "@/lib/api";
import { clearToken, getToken } from "@/lib/session";

type AppState = {
  user: User;
  profile: Profile;
  setUser: (u: User) => void;
  setProfile: (p: Profile) => void;
  logout: () => void;
};

const AppContext = createContext<AppState | null>(null);

/**
 * The logged-in user and their profile, for any page inside /app.
 * `null` while they are loading — the page shows <PageLoading /> meanwhile.
 */
export function useApp() {
  return useContext(AppContext);
}

export function PageLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24 text-mint-dark" role="status" aria-label="Завантаження">
      <Spinner className="size-8" />
    </div>
  );
}

const NAV = [
  { href: "/app", label: "Стрічка", icon: <path d="M4 5h16M4 12h16M4 19h10" /> },
  {
    href: "/app/matches",
    label: "Метчі",
    icon: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  },
];

const MENU = [
  { href: "/app/profile", label: "Моя анкета" },
  { href: "/app/settings", label: "Налаштування" },
];

/** Shared frame for /app/*: checks the login, loads the profile, shows the header, profile menu and phone nav. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Logged-in users with a finished profile only.
  useEffect(() => {
    if (!getToken()) return router.replace("/login");
    Promise.all([authApi.me(), profileApi.get()])
      .then(([u, p]) => {
        if (!u.onboarded) return router.replace("/onboarding");
        setUser(u);
        setProfile(p);
      })
      .catch(() => {
        clearToken();
        router.replace("/login");
      });
    // Next (cacheComponents) keeps state when you leave — don't show a previous user's data next time.
    return () => {
      setUser(null);
      setProfile(null);
    };
  }, [router]);

  const logout = useCallback(() => {
    clearToken();
    router.push("/");
  }, [router]);

  const ready = user && profile;

  // The page is always rendered (Next validates it); until the user is loaded it shows <PageLoading />.
  return (
    <AppContext.Provider value={ready ? { user, profile, setUser, setProfile, logout } : null}>
      <div className="flex min-h-dvh flex-col">
        {ready && (
          <header className="sticky top-0 z-30 border-b border-line/60 bg-white/95 backdrop-blur">
            <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between gap-4 px-4 sm:h-[72px] sm:px-6">
              <Brand size={36} href="/app" />
              <nav aria-label="Розділи" className="hidden flex-1 justify-center gap-1 sm:flex">
                {NAV.map((item) => (
                  <NavLink key={item.href} {...item} variant="top" />
                ))}
              </nav>
              <ProfileMenu name={user.name} photo={profile.photos[0]?.url} onLogout={logout} />
            </div>
          </header>
        )}

        {/* Extra bottom space on phones so the bottom bar doesn't cover the page */}
        <div className="flex flex-1 flex-col pb-20 sm:pb-0">{children}</div>

        {ready && (
          <nav
            aria-label="Розділи"
            className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-line/60 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
          >
            {NAV.map((item) => (
              <NavLink key={item.href} {...item} variant="bottom" />
            ))}
            <NavLink
              href="/app/profile"
              label="Профіль"
              variant="bottom"
              icon={
                <>
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </>
              }
            />
          </nav>
        )}
      </div>
    </AppContext.Provider>
  );
}

function NavLink({
  href,
  label,
  icon,
  variant,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  variant: "top" | "bottom";
}) {
  const pathname = usePathname();
  const active = href === "/app" ? pathname === "/app" : pathname.startsWith(href);
  const svg = (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {icon}
    </svg>
  );

  if (variant === "bottom") {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex flex-col items-center gap-1 py-2.5 text-xs font-medium ${active ? "text-mint-dark" : "text-muted"}`}
      >
        {svg}
        {label}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-medium transition-colors ${
        active ? "bg-mint-tint text-ink" : "text-body hover:text-ink"
      }`}
    >
      {svg}
      {label}
    </Link>
  );
}

/** Avatar button → «Моя анкета», «Налаштування», «Вийти». Closes on Esc, outside click and navigation. */
function ProfileMenu({ name, photo, onLogout }: { name: string; photo?: string; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

  // Close when the page changes.
  const [shownFor, setShownFor] = useState(pathname);
  if (shownFor !== pathname) {
    setShownFor(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    items()[0]?.focus();
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function onMenuKey(e: React.KeyboardEvent) {
    const list = items();
    const i = list.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = (i + (e.key === "ArrowDown" ? 1 : -1) + list.length) % list.length;
      list[next]?.focus();
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      list[e.key === "Home" ? 0 : list.length - 1]?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  const itemClass = "flex w-full items-center rounded-xl px-3 py-2.5 text-left text-ink outline-none hover:bg-mint-tint focus-visible:bg-mint-tint";

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Меню профілю: ${name}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={`flex size-10 items-center justify-center overflow-hidden rounded-full border-2 bg-mint-tint font-display font-bold text-mint-dark transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mint-dark sm:size-11 ${
          open ? "border-mint" : "border-line hover:border-mint"
        }`}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- user uploads from the API host
          <img src={photo} alt="" className="size-full object-cover" />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Профіль"
          onKeyDown={onMenuKey}
          className="absolute right-0 top-full mt-2 w-60 animate-fade-in rounded-2xl border border-line/60 bg-white p-2 shadow-float"
        >
          <p className="truncate px-3 pb-2 pt-1 text-sm text-muted">{name}</p>
          {MENU.map((m) => (
            <Link key={m.href} href={m.href} role="menuitem" tabIndex={-1} className={itemClass}>
              {m.label}
            </Link>
          ))}
          <div className="my-1 h-px bg-line/60" role="separator" />
          <button type="button" role="menuitem" tabIndex={-1} onClick={onLogout} className={`${itemClass} text-warning`}>
            Вийти
          </button>
        </div>
      )}
    </div>
  );
}

/** Placeholder for sections that come later. */
export function ComingSoon({ title, text }: { title: string; text: string }) {
  if (!useApp()) return <PageLoading />;
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-rise rounded-3xl bg-white p-8 text-center shadow-float">
        <p className="text-xs font-bold uppercase tracking-[2px] text-mint-dark">Скоро</p>
        <h1 className="mt-2 font-display text-2xl font-bold">{title}</h1>
        <p className="mt-3 text-body">{text}</p>
      </div>
    </main>
  );
}
