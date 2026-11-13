import Link from "next/link";
import { Brand, ButtonLink, Logo, Wordmark } from "./ui";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-[60px] max-w-6xl items-center justify-between gap-4 px-4 sm:h-[72px] sm:px-6">
        <Brand size={36} hideWordmarkOnPhone />
        <div className="hidden items-center gap-8 font-medium text-body md:flex">
          <a href="#about" className="hover:text-mint-dark">
            Про нас
          </a>
          <a href="#faq" className="hover:text-mint-dark">
            Питання
          </a>
        </div>
        <div className="flex items-center gap-2">
          <ButtonLink href="/register" variant="outline" className="px-4 py-2 text-sm sm:px-5">
            Реєстрація
          </ButtonLink>
          <ButtonLink href="/login" className="px-4 py-2 text-sm sm:px-5">
            Увійти
          </ButtonLink>
        </div>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto bg-ink text-on-dark">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="rounded-[10px] bg-white p-1">
              <Logo size={32} />
            </span>
            <Wordmark className="text-xl !text-on-dark" />
          </div>
          <p className="text-on-dark-2">Знайди свого. Поділись своїм.</p>
        </div>

        <div>
          <p className="mb-3 font-display text-sm font-semibold">Навігація</p>
          <ul className="flex flex-col gap-2 text-on-dark-2">
            <li><Link href="/#about" className="hover:text-mint-light">Про нас</Link></li>
            <li><Link href="/#faq" className="hover:text-mint-light">Питання</Link></li>
            <li><Link href="/register" className="hover:text-mint-light">Реєстрація</Link></li>
            <li><Link href="/login" className="hover:text-mint-light">Увійти</Link></li>
          </ul>
        </div>

        <div>
          <p className="mb-3 font-display text-sm font-semibold">Ми в мережі</p>
          <ul className="flex flex-col gap-2 text-on-dark-2">
            <li>
              <a href="https://x.com/roomie_ua" target="_blank" rel="noreferrer" className="hover:text-mint-light">
                X (Twitter) — @roomie_ua
              </a>
            </li>
            <li>
              <a href="mailto:roomie.ua@gmail.com" className="hover:text-mint-light">
                roomie.ua@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-sm text-on-dark-2 sm:px-6">
          © 2026 Roomie. Зроблено студентами для студентів.
        </p>
      </div>
    </footer>
  );
}
