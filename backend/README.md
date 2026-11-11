# Roomie — backend context

> **For Claude:** this is the context for the Roomie backend. Follow it. When something is marked **OPEN**, ask the lead (Дімітрій Немеш) before deciding.

## What it is
**Roomie** is a web app where students of **Lviv universities** find a roommate, like "Tinder for roommates". The team is from Lviv Polytechnic, but the app is for every university in Lviv. Students sign up with their university email and fill in a profile (habits, budget, what they're looking for). Then they swipe other students. A mutual like creates a **match**, and a match opens a **real-time chat**. The only paid feature is **«Буст»** (Boost): it shows your card higher in the feed. The MVP takes **4 weeks** and is a website only.

- The team is 2 frontend devs, 2 backend devs, and the lead, who is fullstack.
- All user-facing text is in **Ukrainian**, including error messages. Code, commits and identifiers are in English.

## Stack
- **Framework:** NestJS (TypeScript) built as a **modular monolith**, not microservices.
- **Data:** PostgreSQL with Prisma.
- **Auth:** JWT, with bcrypt for passwords.
- **Chat:** Socket.IO.
- **API docs:** Swagger at `/api/docs`.
- **Other services:** Cloudinary for photos, GitHub Actions for CI, Railway for deploy.
- **Run locally:** `docker compose up` starts the API and Postgres. Secrets go in `.env`, and `.env.example` is committed.
- **Email:** Gmail SMTP from roomie.ua@gmail.com. **OPEN:** we may switch to our own domain with Resend.

## Modules
`Auth` · `Mail` · `Profile` · `Photos` · `Feed` · `Swipes` · `Chat` · `Boost` · `Moderation`

Each module has its own folder with `*.module.ts`, `*.controller.ts`, `*.service.ts` and `dto/`. A global JWT guard protects every route except `/auth/*`.

```
request → JWT guard → controller (DTO validation) → service → Prisma → PostgreSQL → JSON
```

## Database
| Table | Fields |
|---|---|
| `users` | id, email, passwordHash, name, verified, onboarded, createdAt |
| `email_codes` | email, codeHash, expiresAt, attempts |
| `profiles` | userId, age, university, institute, course, bio, habits (JSON), looking (JSON) |
| `photos` | id, userId, url, position |
| `swipes` | fromId, toId, liked, createdAt — unique (fromId, toId) |
| `matches` | id, userAId, userBId, createdAt — unique pair |
| `messages` | id, matchId, authorId, text, createdAt, readAt |
| `boosts` | userId, plan, until |
| `reports` | id, fromId, userId, reason |
| `blocks` | fromId, userId |

## API
All requests and responses are JSON. Every route except auth needs the header `Authorization: Bearer <token>`.

### Auth (week 1)
| Endpoint | Body | Success | Errors |
|---|---|---|---|
| `POST /auth/register` | `{email, password, name}` | `201 {sent:true}` | `400 EMAIL_NOT_STUDENT`, `400 WEAK_PASSWORD`, `409 EMAIL_TAKEN` |
| `POST /auth/verify-email` | `{email, code}` | `200 {accessToken, user}` | `400 CODE_INVALID`, `400 CODE_EXPIRED`, `429 TOO_MANY_ATTEMPTS` |
| `POST /auth/resend-code` | `{email}` | `200 {sent:true}` | `429` if less than 60 s since the last code |
| `POST /auth/login` | `{email, password}` | `200 {accessToken, user}` | `401 INVALID_CREDENTIALS`, `403 EMAIL_NOT_VERIFIED` |
| `GET /auth/me` | — | `200 {id, email, name, verified, onboarded}` | `401` |

The verification code:
- has 6 digits
- is valid for 10 minutes
- allows at most 5 attempts
- is stored only as a hash

### Later weeks
- **Profile:**
  - `GET /profile/me` returns your own profile.
  - `PUT /profile/me` takes a partial update and returns the full profile.
  - `POST /profile/me/photos` uploads a photo (multipart). Limits: at most 4 photos, each at most 5 MB.
  - `DELETE /profile/me/photos/:id` deletes a photo.
  - `GET /users/:id` returns another user's public profile. It never includes their email.
- **Feed:**
  - `GET /feed?limit=10&university=<code>` returns `{items:[{id,name,age,university,institute,course,photos,habits,compatibility,boosted}]}`.
  - It excludes yourself, people you already swiped, blocked users and incomplete profiles.
  - It sorts Boosted users first, then by `compatibility` (0–100, based on habits and budget).
- **Swipes:**
  - `POST /swipes {targetId, liked}` returns `201 {match:null}` or `{match:{id,user}}`.
  - It returns `409` if you already swiped that person.
- **Chat:**
  - `GET /matches` lists your matches.
  - `GET /matches/:id/messages?before=<msgId>` returns 30 messages per page. It returns `403` if the match isn't yours.
  - `POST /matches/:id/messages` sends a message (fallback when the socket isn't available).
  - `DELETE /matches/:id` removes a match.
- **WebSocket:** Socket.IO with one room per match.
  - Connect with `connect {auth:{token}}`.
  - Events: `message:send`, `message:new`, `typing`, `message:read`, `match:new`.
- **Boost and moderation:**
  - `GET /boost` returns `{active, until}`.
  - `POST /boost {plan:"week"}` buys a Boost (test payment in the MVP).
  - `POST /reports {userId, reason: spam|fake|rude|other}` reports a user.
  - `POST /blocks {userId}` blocks a user.

## Error format (always)
```json
{"error":{"code":"EMAIL_NOT_STUDENT","message":"Потрібна студентська пошта львівського університету"}}
```

## Allowed university emails
Sign-up is open to students of any Lviv university. The allowed email domains live in **one config list** (for example `ALLOWED_EMAIL_DOMAINS` in `.env`, or a `universities` table with `code, name, emailDomain`), never hard-coded in checks. The university is set from the email domain at sign-up.

Example list (`lpnu.ua` is confirmed; the rest must be checked):

| code | University | Domain |
|---|---|---|
| `lpnu` | Львівська політехніка | `lpnu.ua` |
| `lnu` | ЛНУ ім. Франка | `lnu.edu.ua` — **check** |
| `ucu` | УКУ | `ucu.edu.ua` — **check** |

Add more by appending to the list. No code changes needed.

## Validation
The frontend uses the same rules, but the backend always checks again.

| Field | Rule | Message |
|---|---|---|
| email | trim, lowercase, domain is in the allowed list (see below), ≤254 | «Потрібна студентська пошта львівського університету» |
| password | 8–72 chars, ≥1 letter and ≥1 digit | «Мінімум 8 символів, літера і цифра» |
| name | 2–40 chars: letters, space, `’`, `-` | «Ім’я — від 2 до 40 літер» |
| code | exactly 6 digits | «Код — 6 цифр» |

## Week 1 (backend)
| | Tue | Wed | Thu | Fri |
|---|---|---|---|---|
| **BE1** | Prisma: `users`, `email_codes` | `register`: validation, bcrypt, send code | `verify-email` + `resend-code`, attempt limits | `login` + JWT, `GET /auth/me` |
| **BE2** | NestJS + docker compose, `.env.example` | Mail module + email template | Global validation pipe, error filter, CORS, rate limit | Swagger, GitHub Actions, Railway deploy |

**Week 1 is done when**, on the deployed site, a user can:
1. sign up with a university email
2. get the email and enter the code
3. land on `/app`
4. log out and log in again

## Rules
- **Branches:** one task = one branch, named after the Jira key, for example `ROOM-12-login`. Commit messages look like `ROOM-12: login endpoint`.
- **Merging:** changes go into `main` only through a PR reviewed by the lead.
- **Secrets:** never commit secrets.
- **Done means:** the code runs in Docker without errors and the endpoint is documented in Swagger.

## Open decisions (ask first)
1. Login method: password plus email code (the current plan) or code-only login.
2. Email sending: Gmail SMTP or our own domain with Resend.
3. Token storage: a Bearer token in localStorage (proposed) or httpOnly cookies.
4. The Boost price.
5. The final list of Lviv universities and their real student email domains (do outside emails reach them?).

## Як запустити
```bash
cp .env.example .env        # секрети лише в .env
docker compose up --build   # API на http://localhost:3000, Swagger на /api/docs
```
Локально без Docker для API: `docker compose up -d db`, `npx prisma migrate deploy`, `npm run start:dev`.
Поки `SMTP_USER` у `.env` порожній, код підтвердження не надсилається, а пишеться в консоль API.

## Що вже є
- **Auth:** `POST /auth/register`, `POST /auth/verify-email`, `POST /auth/resend-code`, `POST /auth/login`, `GET /auth/me`
- **Profile:** `GET /profile/me`, `PUT /profile/me` (часткове оновлення; після повної анкети `onboarded = true`), `GET /users/:id`
- Дозволені пошти: `lpnu.ua`, `edu.lpnu.ua`, `lnu.edu.ua`, `ldufk.edu.ua`, `meduniv.lviv.ua` — список у `src/config/universities.ts`
