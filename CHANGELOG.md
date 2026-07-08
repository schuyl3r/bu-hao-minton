# Changelog

## 1.2.0

- Courts can now queue a next round using players still mid-game on another court — reserve them with "Queue next round," and the round auto-starts the moment everyone's actually free. Reserved players are tagged wherever they'd otherwise disappear (the swap bench, the waiting list) so it's clear why the pool shrank.
- The Players tab now splits into "This Week" (who's marked present) and "Rest of Roster" (everyone else you've saved) once a session starts, with search to quickly find and add someone from a long roster.
- Starting a new session no longer asks for a player count or auto-generates "Player N" placeholders — your saved roster carries over as-is, and you pick who's attending from the Players tab, including adding anyone brand new inline.

## 1.1.1

- Fixed number inputs on the Session tab (courts/players/hours) getting stuck at 0 when cleared to retype a value.
- Added a way to remove a photo while adding a new player, matching the existing roster row behavior.
- Sheets and modals (help, request, round proposal, mark complete, session costs, add player) now lock page scroll so the background can't be scrolled or interacted with underneath.
- The bottom nav bar now hides while the on-screen keyboard is open, freeing up space.
- The player name field in the roster now looks editable (tinted background + pencil icon) instead of plain text.
- The "Add player" pop-up is now a centered modal, matching the round-proposal card on the Courts tab.

## 1.1.0

- After ending a session, an optional pop-up lets you record the total court cost and shuttlecock pricing (per shuttle or per tube).
- The PDF summary now includes a cost breakdown with an even per-person share across everyone who attended.

## 1.0.0

- Roster management: add/remove players, avatar photos, skill tiers, search-and-scroll, clear-all.
- Session flow: start/end a session, attendance tracking, catch-up mode, skill tier balance.
- Court randomizer: fairness-ranked round generation, match requests, live shuttlecock tracking per round.
- PDF session summary export: games played, fairness check, repeat pairings, unhonored requests.
