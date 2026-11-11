# Roomie — project context

> **For Claude (or any AI assistant):** this file is the shared context for the Roomie team.
> Read it fully before helping. Treat it as the source of truth about the product, the plan
> and the visual style. When something here conflicts with a guess, follow this file. When
> something is marked **OPEN**, ask instead of deciding.

---

## 1. What Roomie is

**Roomie** is a web app for students to find a roommate — "Tinder for roommates".
A student fills in a profile with their habits, swipes other verified students, and when
both like each other it's a **match** and a **chat** opens.

- **Slogan (UA):** «Знайди свого. Поділись своїм.» (EN original: "Find your mate. Share your place.")
- **Who builds it:** a team of first-year students at **Lviv Polytechnic National University** (Національний університет «Львівська політехніка»). It's a university project and a real startup attempt.
- **Who it's for:** students of **all Lviv universities** (not only Polytechnic). Later: all of Ukraine.
- **Status (Nov 2026):** a coming-soon page is live. The MVP is being built: **4 weeks, website only (no mobile app), written with AI help**.

### Links and contacts
| What | Where |
|---|---|
| Live site (coming soon) | https://roomieua.vercel.app/ |
| X (Twitter) | @roomie_ua |
| Email | roomie.ua@gmail.com |

### Team
| Role | Who | Area |
|---|---|---|
| Team lead, fullstack | **Дімітрій Немеш** (group ПП-11) | Jira tasks, code review, architecture, pitch, helps everyone |
| FE1 | frontend | Landing, sign-up/login, verification, onboarding, profile, Boost page |
| FE2 | frontend | Next.js setup, app layout, feed/swipes, matches, chat |
| BE1 | backend | DB schema, auth, profile, photos, Boost, moderation |
| BE2 | backend | NestJS + Docker setup, feed, swipes/matches, chat, deploy |

**Name spelling:** the lead's name is **Дімітрій Немеш** (Dimitrii Nemesh). Never "Дмитрій" / "Dmytro".

---

## 2. Language and tone

- **All user-facing text is in Ukrainian.** The only exception is the brand name **Roomie**.
- Simple, friendly, short. Address users as «ти». No corporate words, no long paragraphs.
- Typography: Ukrainian quotes «…», the apostrophe ’ (ім’я, пам’ять), the long dash —.
- The team are first-year students, so we never claim research, user interviews or traction we don't have. The honest pitch is "we're first-years, we need this app ourselves".
- **Never invent statistics.** Use real, sourced numbers or a placeholder like `[__]`.
- Team chat is in Ukrainian. Code, commits and identifiers are in English.

---

## 3. Product

### MVP features (only these six)
1. **Student-only sign-in** — email must be from an allowed Lviv university domain (e.g. `@lpnu.ua`; list in config, see §4)
2. **Profile (анкета)** — photos, institute, course, bio, habits, what you're looking for
3. **Swipes** — a feed of cards with filters, "Так / Ні"
4. **Matches** — a mutual like creates a pair
5. **Chat** — real-time messages between a matched pair
6. **Буст (Boost)** — paid subscription: your card shows higher in the feed (test payment in the MVP)

### Business model
- **Free** for students during early access.
- Money comes only from the **«Буст» subscription**. **No partnerships, no ads.**

### Go-to-market
Lviv Polytechnic (our own university, first users) → all Lviv universities → ambassadors in each university → word of mouth («сарафанне радіо») →
other Lviv universities → all of Ukraine.

### User flow
`Лендинг → Реєстрація (університетська пошта) → Підтвердження пошти → Анкета → Стрічка/свайпи → Метч → Чат`

### Pages
| Page | Route | Content | API |
|---|---|---|---|
| Landing | `/` | Slogan, 3 steps, "Почати", "only students", FAQ, footer with X + email | — |
| Sign up | `/register` | name, email, password, repeat password | `POST /auth/register` |
| Verify email | `/verify` | 6-digit code, paste support, resend timer | `POST /auth/verify-email`, `POST /auth/resend-code` |
| Login | `/login` | email, password | `POST /auth/login` |
| Onboarding | `/onboarding` | 4 steps: about me, photos (1–4), habits, what I'm looking for | `PUT /profile/me`, `POST /profile/me/photos` |
| Feed | `/app` | one card, "Так"/"Ні", swipe or ← →, filters, "Це метч!" modal | `GET /feed`, `POST /swipes` |
| Matches | `/app/matches` | list with last message + unread count | `GET /matches` |
| Chat | `/app/matches/[id]` | messages + input, real time | `GET …/messages`, WebSocket |
| Profile | `/app/profile` | my profile as others see it, edit, log out | `GET/PUT /profile/me` |
| Boost | `/app/boost` | what it gives, price `[__ грн]`, button | `GET/POST /boost` |

Everything under `/app` requires login → otherwise redirect to `/login`.
Without a finished profile → redirect to `/onboarding`.

---

## 4. Tech stack and architecture

**Rule: TypeScript everywhere.** It's a **modular monolith**, not microservices.

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS, Framer Motion for swipes, Socket.IO client. Deployed on **Vercel**. Responsive website (desktop + phone). |
| Backend | Node.js + **NestJS** (TypeScript), **PostgreSQL + Prisma**, JWT auth, Socket.IO for chat, Swagger at `/api/docs`. Runs in **Docker** (`docker compose up` = API + Postgres). Deploy on **Railway**. |
| Photos | Cloudinary |
| Email | Gmail SMTP from roomie.ua@gmail.com (no own domain yet) — **OPEN**, see §8 |
| CI | GitHub Actions |

### Backend modules
`Auth` (sign-up, codes, JWT) · `Mail` · `Profile` · `Photos` · `Feed` (who to show) ·
`Swipes` (likes → matches) · `Chat` (REST + WebSocket) · `Boost` · `Moderation` (reports, blocks).
Each module is a folder with `*.controller.ts`, `*.service.ts`, `*.module.ts`, `dto/`.
A JWT guard checks the token on every request except auth endpoints.

Request path: `request → JWT guard → controller (validates DTO) → service (logic) → Prisma → PostgreSQL → JSON`.

### Database (10 tables)
| Table | Fields |
|---|---|
| `users` | id, email, passwordHash, name, verified, onboarded, createdAt |
| `email_codes` | email, codeHash, expiresAt, attempts |
| `profiles` | userId → users, age, university, institute, course, bio, habits (JSON), looking (JSON) |
| `photos` | id, userId → users, url, position |
| `swipes` | fromId → users, toId → users, liked, createdAt — unique (fromId, toId) |
| `matches` | id, userAId → users, userBId → users, createdAt — unique pair |
| `messages` | id, matchId → matches, authorId → users, text, createdAt, readAt |
| `boosts` | userId → users, plan, until |
| `reports` | id, fromId → users, userId → users, reason |
| `blocks` | fromId → users, userId → users |

### API (all JSON; `Authorization: Bearer <token>` except auth)
**Auth (week 1)**
| Endpoint | Request | Success | Errors |
|---|---|---|---|
| `POST /auth/register` | `{email, password, name}` | `201 {sent: true}` | `400 EMAIL_NOT_STUDENT`, `400 WEAK_PASSWORD`, `409 EMAIL_TAKEN` |
| `POST /auth/verify-email` | `{email, code}` | `200 {accessToken, user}` | `400 CODE_INVALID`, `400 CODE_EXPIRED`, `429 TOO_MANY_ATTEMPTS` |
| `POST /auth/resend-code` | `{email}` | `200 {sent: true}` | `429` if < 60 s since last code |
| `POST /auth/login` | `{email, password}` | `200 {accessToken, user}` | `401 INVALID_CREDENTIALS`, `403 EMAIL_NOT_VERIFIED` → front goes to `/verify` |
| `GET /auth/me` | — | `200 {id, email, name, verified, onboarded}` | `401` |

Code: 6 digits, valid 10 minutes, max 5 attempts, stored only as a hash. Passwords: bcrypt.

**Profile & photos:** `GET /profile/me`, `PUT /profile/me` (partial updates allowed, returns the full profile), `POST /profile/me/photos` (multipart, ≤4 photos, ≤5 MB), `DELETE /profile/me/photos/:id`, `GET /users/:id` (public profile, never the email).

Profile example:
```json
{"id":"u_123","name":"Іван","age":18,"university":"lpnu","institute":"ІКНІ","course":1,"bio":"…",
 "photos":[{"id":"ph_1","url":"https://…"}],
 "habits":{"sleep":"early","clean":4,"smoking":false,"guests":"rarely"},
 "looking":{"budget":[2000,4000],"housing":"dorm","district":"…"}}
```

**Feed & swipes:** `GET /feed?limit=10` → `{items:[{id,name,age,university,institute,course,photos,habits,compatibility,boosted}]}`;
`POST /swipes {targetId, liked}` → `201 {match: null}` or `{match:{id,user}}`, `409` if already swiped.
Feed rules: not me, not already swiped, not blocked, profile complete, matches filters; Boosted first, then by `compatibility` (0–100, habits + budget).

**Matches & chat:** `GET /matches`, `GET /matches/:id/messages?before=<msgId>` (30 per page, `403` if not your match), `POST /matches/:id/messages` (fallback), `DELETE /matches/:id`.
WebSocket (Socket.IO, one room per match): `connect {auth:{token}}`, `message:send`, `message:new`, `typing`, `message:read`, `match:new`.

**Boost & moderation:** `GET /boost` → `{active, until}`, `POST /boost {plan:"week"}`, `POST /reports {userId, reason: spam|fake|rude|other}`, `POST /blocks {userId}`.

**Error format (always):**
```json
{"error":{"code":"EMAIL_NOT_STUDENT","message":"Потрібна студентська пошта львівського університету"}}
```
Status codes: 200, 201, 204, 400, 401, 403, 404, 409, 429, 500.

### Allowed universities
One config list of Lviv universities (`code, name, emailDomain`), e.g. `lpnu` / Львівська політехніка / `lpnu.ua`. More (ЛНУ ім. Франка, УКУ, …) are added to the list once their domains are confirmed. The user's university is set from their email domain; the feed can filter by university.

### Validation (same rules on frontend and backend)
| Field | Rule | Error text (UA) |
|---|---|---|
| Email | trim, lowercase, domain in the allowed Lviv universities list, ≤254 | «Потрібна студентська пошта львівського університету» |
| Password | 8–72 chars, at least 1 letter and 1 digit | «Мінімум 8 символів, літера і цифра» |
| Repeat password | equals password | «Паролі не збігаються» |
| Name | 2–40 chars, letters, space, `’`, `-` | «Ім’я — від 2 до 40 літер» |
| Code | exactly 6 digits | «Код — 6 цифр» |

Frontend shows the error under the field on blur/submit; the backend always re-validates.

---

## 5. How the team works

- **Monday:** the lead prepares tasks in Jira + one team meeting in **Google Meet**.
- **Tuesday–Friday:** everyone does **one task per day** and opens a PR by evening.
- Questions → the team **Telegram group**. Other calls are optional.
- Jira columns: To Do → In Progress → Review → Done.

### Git rules
1. One task = one branch, named after the Jira key: `ROOM-12-login`.
2. Nothing goes into `main` without a PR and the lead's review. `main` is protected.
3. No secrets in code: they go in `.env` (git-ignored); commit `.env.example`.
Commit messages: `ROOM-12: login form`.

### Definition of done
PR exists · reviewed by at least one person · runs in Docker without errors · no secrets in code ·
the site works on desktop **and** phone · Jira card moved to Done.

Code is written **with AI help (Claude, Copilot)**, but everyone must understand what they commit.

---

## 6. Roadmap — MVP in 4 weeks

| Week | Goal | Result |
|---|---|---|
| 1 | Foundation | Projects, Docker, DB, landing, sign-up + email verification + login |
| 2 | Profile & swipes | Onboarding, photos, feed, swipes |
| 3 | Matches & chat | Matches, real-time chat, Boost |
| 4 | Launch | Tests, fixes, deploy, first students from Lviv universities |

### Week 1 by day
| | Tue | Wed | Thu | Fri |
|---|---|---|---|---|
| **FE1** | UI kit: Button, Input with error state, Card | Landing | `/register` + validation | `/verify`: 6 inputs, resend timer |
| **FE2** | Next.js + Tailwind, Vercel deploy, API client with mocks | `/login` + validation | Token storage, protect `/app`, log out | Connect real API, error handling, end-to-end check |
| **BE1** | Prisma: `users`, `email_codes` | `register`: validation, bcrypt, send code | `verify-email` + `resend-code`, attempt limits | `login` + JWT, `GET /auth/me` |
| **BE2** | NestJS + docker compose, `.env.example` | Mail module + email template | Global validation, error format, CORS, rate limit | Swagger, GitHub Actions, Railway deploy |

**Week 1 done =** on the deployed site you can sign up with a university email, get the email, enter the code, land on `/app`, log out and log in again.

---

## 7. Design system (style of the Roomie pitch deck and site)

### Look
Clean, light, friendly. **White + mint.** Lots of air, big rounded cards, one idea per screen.
Dark green is used for one accent element per screen (the "highlighted" card, a key block).

### Colors
| Token | Hex | Use |
|---|---|---|
| `mint` | `#3CCB98` | Brand color, logo tile, primary buttons, accents, the dot in "Roomie." |
| `ink` | `#12302A` | Main text, dark accent cards, dark section slides |
| `mint-dark` | `#0F7A5F` | Small labels/eyebrows and links on light backgrounds (contrast-safe mint) |
| `mint-light` | `#8FE3C0` | Gradients, highlights on dark |
| `mint-tint` | `#E8F7F1` | Card backgrounds on white |
| `paper` | `#FBFDFC` | Page/slide background (toned white) |
| `body` | `#3D5A52` | Secondary text on light |
| `muted` | `#5E7A72` | Footers, captions |
| `on-dark` | `#F2FBF7` / `#BFE3D6` | Text / secondary text on `ink` |
| `border` | `#CDEBDF` | Input borders, outlines |
| `warning` | `#B4470C` | Problems/errors (use sparingly) |

Dark text on mint buttons (`#12302A` on `#3CCB98`), never white text on mint (low contrast).

### Typography
- **Unbounded** (600–800) — headings, the "Roomie" wordmark, big numbers. Wide, so keep headings short.
- **Rubik** (400/500/700) — all body text, buttons, inputs.
- **JetBrains Mono** — only for code (decks/docs).
- All loaded from Google Fonts with the **Cyrillic** subset.
- Deck scale (1920×1080): 160 cover / 96 section titles / 56 slide titles / 36–28 body / 24 minimum.
- Labels ("eyebrows") above titles: 24px, bold, uppercase, letter-spacing 2px, `mint-dark`. Example: `01 · ЗАГАЛЬНЕ`.

### Shapes and components
- Cards: `mint-tint` background, radius **24px**, padding 32–40px, no border. The emphasized card is `ink` with `on-dark` text.
- Buttons and pills: fully rounded (`999px`). Primary = mint with ink text; secondary = ink with white text; tertiary = outline `border`.
- Inputs: white, 2px `border`, radius 14px; error state = `warning` border + Ukrainian text under the field.
- Chips (habits, filters): rounded pills; selected = mint + bold.
- Arrows/flows: mint block arrows between cards.
- Icons: simple line icons (Lock, Users, Chat, Lightning for Boost, etc.).
- Soft shadow only for floating elements: `0 12px 40px rgba(18,48,42,0.10)`.

### Logo
- Two walking stick figures, one throwing/holding a **key**, white on a **mint rounded tile** (rx ≈ 22% of the size). Files: `logo/roomie-logo.svg`, `logo/roomie-logo.png`.
- **Always show the logo on a white/light background** so the mint tile is visible. Never put the mint tile on a mint background.
- Wordmark: **"Roomie."** in Unbounded 800, ink, with the dot in mint.

### Deck layout rules (Slides)
- 16:9, 1920×1080, margins 128px, footer row at the bottom: `Roomie · <deck name> · NN` in 24px `muted`.
- Content slide: eyebrow → title (top-left, never centered) → one block of content (cards row, table, diagram).
- Section divider slide: `ink` background, big mint number (`02`), title 96px, one-line description.
- Cover: white background, mint stripe at the top, logo, "Roomie." 160px, subtitle.
- One idea per slide; prefer cards, tables and diagrams over bullet lists.

### Website (coming-soon page, live)
`coming-soon/` — Next.js 16, statically prerendered.
- White sticky navbar (72px, 60px on mobile) with logo + "Roomie." wordmark.
- Mint full-page background, typing headline «Coming soon» with animated white dots.
- SVG animation: two figures tossing a key underhand (`app/KeyToss.tsx`, `app/keyTossMotion.ts`), respects `prefers-reduced-motion`.
- Mobile-safe (safe-area insets, `dvh`). Vercel root directory = `coming-soon`.

---

## 8. Open decisions (ask the lead before assuming)

1. **Login method:** email + password with code verification (current plan, §4) **or** passwordless code-only login (simpler). **OPEN.**
2. **Email sending:** Gmail SMTP from roomie.ua@gmail.com (no domain needed, ~500 emails/day) vs buying a domain (e.g. `roomie.com.ua`) + Resend. Resend without a verified domain can only email the account owner. **OPEN.**
3. **Token storage:** `Authorization: Bearer` + localStorage (proposed, because front and back are on different domains) vs httpOnly cookies. **OPEN.**
4. The final list of Lviv universities and their real student email domains (only `lpnu.ua` is confirmed), and that outside emails reach them.
5. Boost price — `[__ грн]`.

---

## 9. Repository layout

| Path | What |
|---|---|
| `backend/` | NestJS API (Prisma, PostgreSQL, Docker). See `backend/README.md` |
| `frontend/` | Next.js website. See `frontend/README.md` |
| `.github/workflows/` | GitHub Actions (backend build) |

### Branches
- `main` — protected, release-ready. Only PRs from `development`.
- `development` — integration branch. PRs from personal branches go here.
- Personal branches: `matseliukh`, `hrunchak`, `pyasta`, `frontend-Nazarii` — branched from `development`.
