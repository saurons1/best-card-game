[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/saurons1/best-card-game/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/saurons1/best-card-game/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

Built for the [make.fun bounty](https://make.fun/bounty/best-card-game-20261122-1826).

# Ember Sigils — a duel of three suits

An original turn-based card duel that plays offline in a desktop browser from
static files. You face the Ashen Warden across a felt table: 20 life each, 3
energy a turn, and a 30-card deck of three suits — **Ember** (red flame),
**Frost** (blue snowflake) and **Thorn** (green leaf) — told apart by colour
*and* shape, never by text alone.

## Rules

- Each turn you gain 3 energy and draw 2 cards. Play cards to **strike**
  (damage), **guard** (block that absorbs damage) or **surge** (draw, heal,
  gain energy).
- **Suit combo:** play two cards of one suit in a turn to fire its bonus —
  Ember +3 damage on your strikes, Frost +4 block, Thorn draws a card. Hand
  order and suit matching matter.
- **Read the foe:** the Warden declares its intent at the start of your turn
  ("will strike for 7", "will guard for 10") — then acts on it when your turn
  ends. Counter it: guard into a big strike, or race it down while it guards.
- Reduce the Warden to 0 life to win; fall to 0 and you lose. Your score is
  damage dealt, plus 5 per suit combo, plus a win bonus.

## Controls

- Mouse: click a card to play it, click **End Turn** (or the Play / Play Again buttons).
- Keyboard: `1`–`7` play a card, `Space`/`Enter` ends the turn (or confirms),
  `P` pauses, `Esc` back to the title, `M` mutes the synthesized sounds.

## Play it

Serve `game/` with any static server (`node serve.ts`, then open
http://localhost:8080) — no build step, no network requests, all art drawn in
canvas and all sounds synthesized with WebAudio.

## Structure

- `game/src/config.js` — constants: suits, combos, life and energy.
- `game/src/cards.js` — the 15 card definitions and the deck builder.
- `game/src/state.js` — the rules: turns, damage, block, suit combos, win/loss.
- `game/src/ai.js` — the Warden's intent: what it declares and why.
- `game/src/render.js` — the table, the cards, the HUD and every screen.
- `game/src/input.js` — mouse and keyboard, mapped through the letterbox.
- `game/src/sound.js` — synthesized sound effects, no audio files.
- `game/src/shots.js` — the staged screenshot scenes (title, table, win, loss).
- `game/src/main.js` — boot and the one loop.
