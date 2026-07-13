# IRONLOG

A hypertrophy training log + coaching platform. React + Vite + Supabase, installable to the
home screen on iOS and Android from one codebase.

`IRONLOG` is a placeholder name — rename it in `index.html`, `vite.config.js` and `package.json`
when you land on the real one.

---

## Getting it live (no terminal needed)

**1. Put the code on GitHub**
- github.com → **New repository** → name it `ironlog` → Create.
- On the empty repo page, click **uploading an existing file**.
- Drag in everything from this folder *except* `node_modules` (there isn't one) → Commit.

**2. Create the Supabase project**
- supabase.com → **New project**. Pick the EU (Frankfurt) region — closest to you, and it keeps
  user data in the EU, which matters once you're charging money.
- Left sidebar → **SQL Editor** → **New query** → paste the whole of `supabase/schema.sql` → **Run**.
  That creates the tables, the row-level security policies, and seeds ~18 exercises.
- **Authentication → Sign In / Providers → Email**: turn **Confirm email** *off* while you're
  building, so you can create test accounts instantly. Turn it back on before real users arrive.
- **Project Settings → API**: copy the **Project URL** and the **anon public** key.

**3. Deploy on Vercel**
- vercel.com → **Add New → Project** → import the GitHub repo.
- Framework preset: **Vite** (it should detect this itself).
- Expand **Environment Variables** and add both:
  - `VITE_SUPABASE_URL` → your project URL
  - `VITE_SUPABASE_ANON_KEY` → your anon public key
- **Deploy.**

**4. Install it on your iPhone**
- Open the Vercel URL in **Safari** (it must be Safari — Chrome on iOS can't install PWAs).
- Share button → **Add to Home Screen**.
- Launch it from the home screen: no browser chrome, own icon, respects the notch and the
  home indicator.

Every push to GitHub redeploys automatically. Editing a file directly on github.com is enough
to ship a change — that's your zero-terminal loop.

The anon key is *meant* to be public. Row Level Security is what protects the data, which is
why every table in the schema has policies on it. Never put the `service_role` key in this app.

---

## What's built

| Area | State |
|---|---|
| PWA shell, icons, iOS safe areas, offline caching | done |
| Email/password auth, session persistence, auto-created profile | done |
| 5-tab navigation: Today / Train / Learn / Progress / You | done |
| Plate-loading strip + bar maths + Epley 1RM | done, live |
| Database schema with RLS: exercises, routines, workouts, sets | done |
| Tracker (log sets, rest timer, history) | **stubbed** |
| Lesson content | **stubbed** — module list only |
| Progress charts | **stubbed** |
| Stripe checkout, check-in booking | not started |

Anything stubbed is marked in the UI with a yellow `STUB —` note, so you always know what's
real and what's scaffolding.

## Design notes

The visual language is cast iron and chalk, not the black-and-neon every other lifting app uses.
Plate colours are the IWF competition set (red 25, blue 20, yellow 15, green 10, white 5) and
they're used to *encode* weight, never as decoration. Numbers are set in a mono face with tabular
figures so sets line up in a column like a paper logbook.

The signature element is `PlateStrip`: enter a weight anywhere in the app and it draws the plates
you'd actually slide onto the bar, sized by mass. It's live on the Train tab — try it on your phone.

## Local dev (optional)

```
npm install
cp .env.example .env.local   # then fill in the two values
npm run dev
```

## Structure

```
src/
  lib/plates.js       bar loading maths, 1RM — pure functions, no React
  lib/supabase.js     client; the app boots without keys in demo mode
  context/            auth session + profile/tier
  components/         AppShell, BottomNav, PlateStrip, ui primitives
  pages/              Auth, Today, Train, Learn, Progress, You
supabase/schema.sql   run once in the SQL editor
```
