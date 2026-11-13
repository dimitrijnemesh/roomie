import { Footer, Navbar } from "@/components/site";
import { UniversityList } from "@/components/UniversityList";
import { ButtonLink, Eyebrow, Logo } from "@/components/ui";
import type { ReactNode } from "react";

const steps = [
  { n: "01", title: "Зареєструйся", text: "Через корпоративну пошту свого вишу — тут лише справжні студенти." },
  { n: "02", title: "Заповни анкету", text: "Фото, інститут, курс і твої звички: сон, чистота, гості." },
  { n: "03", title: "Свайпай і пиши", text: "Взаємне «Так» — це метч. Одразу відкривається чат." },
];

const points = [
  { title: "Лише студенти", text: "Вхід тільки через корпоративну пошту вишів Львова." },
  { title: "Звички, а не лише фото", text: "Порівнюємо режим сну, чистоту, бюджет і житло." },
  { title: "Чат після метчу", text: "Писати можна лише тим, хто теж тебе обрав." },
];

const faq: { q: string; a: ReactNode }[] = [
  {
    q: "Що таке Roomie?",
    a: "Це сайт, де студенти шукають сусіда по кімнаті чи квартирі. Свайпаєш анкети, а коли симпатія взаємна — відкривається чат.",
  },
  {
    q: "Хто може зареєструватися?",
    a: (
      <>
        Студенти вишів Львова з корпоративною поштою:
        <UniversityList className="mt-3 text-sm" />
      </>
    ),
  },
  {
    q: "Це безкоштовно?",
    a: "Так, на час раннього доступу все безкоштовно. Є лише платна підписка «Буст» — вона піднімає твою анкету вище в стрічці.",
  },
  {
    q: "Чи бачать інші мою пошту?",
    a: "Ні. Інші бачать тільки твою анкету: ім’я, фото, інститут, курс і звички.",
  },
  {
    q: "Що, як мені хтось пише неприємне?",
    a: "Можна поскаржитися на користувача або заблокувати його — він більше не побачить тебе в стрічці.",
  },
  {
    q: "Чи є мобільний застосунок?",
    a: "Поки ні — Roomie працює як сайт і зручно відкривається з телефона.",
  },
];

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-mint-tint/60">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-24">
            <div className="flex flex-col items-start gap-6">
              <Logo size={96} className="drop-shadow-[0_12px_40px_rgba(18,48,42,0.12)]" />
              <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight sm:text-7xl">
                Roomie<span className="text-mint">.</span>
              </h1>
              <div className="flex flex-col gap-2">
                <p className="max-w-md text-xl font-medium text-ink sm:text-2xl">
                  Знайди свого. Поділись своїм.
                </p>
                <p className="max-w-md text-lg text-body">
                  Пошук сусіда по кімнаті серед студентів Львова.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/register" className="px-8 py-4 text-lg">
                  Почати
                </ButtonLink>
                <ButtonLink href="/login" variant="outline" className="px-8 py-4 text-lg">
                  Я вже маю акаунт
                </ButtonLink>
              </div>
            </div>

            <div className="rounded-3xl bg-ink p-8 text-on-dark shadow-float sm:p-10">
              <p className="text-xs font-bold uppercase tracking-[2px] text-mint-light">Як це працює</p>
              <ol className="mt-6 flex flex-col gap-6">
                {steps.map((s) => (
                  <li key={s.n} className="flex gap-4">
                    <span className="font-display text-2xl font-extrabold text-mint">{s.n}</span>
                    <div>
                      <p className="font-display text-lg font-semibold">{s.title}</p>
                      <p className="mt-1 text-on-dark-2">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="scroll-mt-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
            <div>
              <Eyebrow>01 · Про нас</Eyebrow>
              <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Сусід за звичками, а не навмання</h2>
              <ul className="mt-8 flex flex-col gap-4">
                {points.map((p) => (
                  <li key={p.title} className="rounded-3xl bg-mint-tint p-6">
                    <p className="font-display font-semibold">{p.title}</p>
                    <p className="mt-1 text-body">{p.text}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col justify-center gap-5 text-lg text-body">
              <p>
                <span className="font-medium text-ink">Roomie</span> — це сайт, де студенти вишів Львова
                шукають сусіда в гуртожиток чи на квартиру. Зареєструватися можна лише через
                корпоративну пошту університету, тож усі анкети — від справжніх студентів.
              </p>
              <p>
                В анкеті ти вказуєш інститут, курс, кілька фото і свої звички: коли лягаєш спати,
                наскільки важлива чистота, чи палиш, як часто кличеш гостей. А ще — що шукаєш:
                бюджет, тип житла і район.
              </p>
              <p>
                У стрічці ти бачиш анкети інших студентів і відповідаєш «Так» або «Ні». Вище
                показуємо тих, з ким у тебе більше спільного. Коли симпатія взаємна — це метч, і
                відкривається чат, де можна домовитися про житло.
              </p>
              <p>
                Користуватися Roomie безкоштовно. Якщо хочеш, щоб твою анкету бачили частіше, є
                підписка «Буст».
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 bg-mint-tint/60">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
            <Eyebrow>02 · Питання</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Часті питання</h2>
            <div className="mt-8 grid items-start gap-4 md:grid-cols-2">
              {[faq.slice(0, Math.ceil(faq.length / 2)), faq.slice(Math.ceil(faq.length / 2))].map((col, c) => (
                <div key={c} className="flex flex-col gap-4">
                  {col.map((f) => (
                    <details key={f.q} className="rounded-3xl bg-white p-6 shadow-[0_2px_12px_rgba(18,48,42,0.05)]">
                      <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium">
                        {f.q}
                        <svg className="faq-arrow size-5 shrink-0 text-mint-dark transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </summary>
                      <div className="mt-3 text-body">{f.a}</div>
                    </details>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-mint p-8 sm:p-12 md:flex-row md:items-center">
              <div>
                <h2 className="font-display text-2xl font-bold sm:text-3xl">Готовий знайти свого?</h2>
                <p className="mt-2 text-ink/80">Реєстрація займе хвилину. Потрібна лише корпоративна пошта твого вишу.</p>
              </div>
              <ButtonLink href="/register" variant="secondary" className="px-8 py-4 text-lg">
                Почати
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
