<img width="1284" height="926" alt="BuHaominton screenshot" src="https://github.com/user-attachments/assets/907958a4-2bb4-461a-b71d-79c131754e50" />

# 不好 BuHaominton

**[buhaominton.vercel.app](https://buhaominton.vercel.app)**

A badminton queue manager built to run rounds of games from one phone, courtside. No accounts, no backend, no sync — everything lives on the device you're holding.

The name is a pun on 不好 (*bù hǎo*, "not good") and "bad(minton)."

## Why this exists

Every time our group plays, someone ends up tracking who's played how many games and who's already played with or against whom — on paper, or from memory, while also trying to actually watch the games. It falls apart after a few rounds. Requests to play with someone specific get forgotten. Late arrivals just get slotted in wherever, with no way to catch up to everyone else's game count.

We tried a few existing badminton queue tools before building this. The free ones we found were mostly plain randomizers — pull names, assign courts, no memory of who's played who, no way to prioritize someone who showed up late. The ones with more logic built in were paid, and built around tournament formats — brackets, seeding, scheduled matches across days — which isn't the shape of a casual weekend session where the only real goal is "make sure everyone gets roughly equal games and doesn't keep playing the same three people."

BuHaominton is built around one round at a time, for one ongoing casual session, with fairness — repeat-pairing avoidance, catching up late arrivals, optional skill balance — as the actual point of the app, not a feature buried behind a paywall.

## What it does

- **Roster & courts persist across sessions.** Add your regular group once; only attendance, stats, and pairing history reset when you start a new session.
- **A randomizer that actually thinks about fairness.** Every round checks every possible group of 4 from the players available, and every way to split each group into two teams — then ranks all of them by a strict set of priorities (below), not a rough shuffle.
- **Catch-up for late arrivals.** Toggle it on and the randomizer starts favoring whoever's played the fewest games, so someone who showed up an hour late doesn't spend the rest of the session behind everyone else.
- **Independent courts.** Each court runs its own round and its own stopwatch — no shared clock, no waiting on other courts to sync up.
- **Session summary + PDF export.** Every game, total shuttlecocks used, the most-repeated pairing, who got the fewest games, and any requests that never got honored — exported as a shareable PDF.
- **Player photos.** Optional avatar per player, captured or uploaded from the phone.

## How the randomizer actually works

When you hit Randomize on a court, it looks at everyone currently present, not resting, and not already playing on another court. From that group, it works out every possible set of 4 players, and every way to split each set of 4 into two teams of 2. Then it scores all of them and ranks them in a strict order — each rule below only settles ties left over from the rule above it, so a higher rule always wins, no blending or averaging scores together.

1. **Match requests** — rounds that satisfy the most pending "play with" or "play against" requests come first. A request only counts if honoring it doesn't force a repeat pairing — unless every possible round this time would force a repeat anyway, in which case there's nothing lost by honoring it.
2. **Fewest repeat pairings** — among what's left, the round where players have played with or against each other the least this session wins.
3. **Catch-up mode** *(optional, off by default)* — among what's left, the round made up of players who've collectively played the fewest games gets picked, so people who've been sitting out longest get pulled back in.
4. **Skill tier balance** *(optional, off by default)* — among what's left, the team split where both teams' combined skill levels are closest wins — this balances the two teams as a whole, not each player against their direct opponent, so an A paired with an E can face a B paired with a D if the totals land close.
5. **Oldest pending request** — if everything above is still tied, whichever request has been waiting longest gets the win, so a newer request can't keep cutting in front of an older one.
6. **Random pick** — only kicks in among rounds that are tied on everything above. This is what makes "re-randomize" actually useful — it never overrides a real difference in ranking, it only breaks a genuine tie.

Catch-up mode and skill tier balance are both off by default and set once per session. When either is off, that step is just skipped and ranking moves straight to the next rule down.

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

---

Built by **Schuyler Ng · 吴德辉**.
