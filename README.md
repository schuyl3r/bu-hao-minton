# BuHaominton

*不好 (bù hǎo) — "not good," playing on "bad(minton)"*

A mobile-first badminton session manager for running actual games at the 
court — not a scheduling app, a live queue tool you use while standing 
there with your phone.

## What it does

- **Smart queue randomization** — generates the next round (not the whole 
  session at once), minimizing repeat pairings while respecting requested 
  matchups and late-arrival catch-up priority
- **Attendance tracking** — mark players present as they arrive; late 
  players get factored into fairness automatically
- **Rest requests** — players can sit out a round without losing their 
  place in the queue
- **Requested/planned matches** — ask to play with or against someone 
  specific; honored when possible without forcing a repeat pairing
- **Optional skill-tier balancing (A–E)** — balances total team skill 
  rather than avoiding mismatched individuals
- **Per-court timers** — independent duration and start time per court, 
  with a live countdown and a warning (not a hard block) when a new round 
  won't fit before time's up
- **Session summary + PDF export** — games played per person, shuttlecocks 
  used, most-repeated pairings, fairness outliers, and unhonored requests

## Why it exists

Built to replace the "shout out who's up next and hope everyone remembers 
who they already played" method of running casual badminton sessions. 
Started as a way to actually use the tool during real games, not just 
demo it.

## Stack

- Next.js 16 / React 19 / TypeScript
- Tailwind CSS v4
- Zustand (with `persist` for local session state)
- No backend — single-device, local-first by design

## Status

🚧 In active development.

## Local development

```bash
npm install
npm run dev
```

## License

MIT
