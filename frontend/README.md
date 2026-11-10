# Roomie — frontend

Next.js 16 (App Router) + TypeScript + Tailwind CSS 4.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

## Сторінки

| Route | Що там |
|---|---|
| `/` | Лендинг: hero, «Про нас», FAQ, футер |
| `/register` | Реєстрація |
| `/verify` | Код підтвердження пошти (6 цифр, таймер повторної відправки) |
| `/login` | Вхід |
| `/app` | Заглушка застосунку |

Форми поки що без валідації і без запитів до API — місця позначені `TODO`.
Список доменів пошт вишів — `src/lib/universities.ts`.
