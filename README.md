# 不好 BuHaominton

A courtside badminton queue and session manager — built for one person to run a night of doubles play from their phone. No accounts, no backend, no sync: everything lives on-device.

The name is a pun on 不好 (*bù hǎo*, "not good") and "bad(minton)."

## What it does

- **Roster & courts persist across sessions.** Add your regular group once; only attendance, stats, and pairing history reset when you start a new session.
- **A randomizer with real priorities.** Every round is picked by exhaustive search over all valid 4-player/team-split combinations, ranked by: honored match requests → minimizing repeat pairings → catch-up weighting for players with fewer games → skill-tier team balance. Ties are broken with an injectable RNG so "re-randomize" can surface a genuinely different (but still optimal) option.
- **Independent courts.** Each court runs its own round and its own count-up stopwatch — no shared clock, no forced sync between courts.
- **Session summary + PDF export.** Every game, total shuttlecocks used, the most-repeated pairing, the fairness outliers, and any requests that never got honored — exported as a shareable PDF.
- **Player photos.** Optional avatar per player, captured or uploaded from the phone, compressed client-side before it ever touches storage.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Zustand (`persist` → `localStorage`)

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run test    # vitest — randomizer + session summary logic
npm run lint
npm run build
```

## Deploying

Zero-config on [Vercel](https://vercel.com/new) — it's a standard Next.js app with no server-side data, no environment variables, and no API routes.

---

Built by **Schuyler Ng**.
