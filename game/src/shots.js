// The screenshot scenes behind ?shot=title|play|win|loss. Each one drives the
// real rules forward from a fresh game with a fixed seed, so the frame is what
// a real game looks like and the same seed always gives the same frame.
import { CARD_BY_ID, CARD_TYPE } from './cards.js';
import { PHASE, createGame, foeAct, playPlayerCard, startDuel } from './state.js';
import { chooseIntent } from './ai.js';
import { SCREEN } from './render.js';

/** A sensible autopilot: strike when it can end the duel, guard when hurt, else play. */
function sensiblePilot(game) {
  const p = game.player;
  let guard = 0;
  while (true) {
    let pick = -1;
    for (let i = 0; i < p.hand.length; i += 1) {
      const card = CARD_BY_ID.get(p.hand[i]);
      if (card.cost > p.energy) continue;
      if (card.type === CARD_TYPE.STRIKE && game.foe.hp <= card.value) { pick = i; break; }
      if (card.type === CARD_TYPE.GUARD && p.hp <= 10 && guard < 8) { pick = i; break; }
    }
    if (pick < 0) {
      for (let i = 0; i < p.hand.length; i += 1) {
        const card = CARD_BY_ID.get(p.hand[i]);
        if (card.cost > p.energy) continue;
        if (card.type === CARD_TYPE.STRIKE) { pick = i; break; }
      }
    }
    if (pick < 0) {
      for (let i = 0; i < p.hand.length; i += 1) {
        const card = CARD_BY_ID.get(p.hand[i]);
        if (card.cost > p.energy) continue;
        if (card.type === CARD_TYPE.GUARD) { pick = i; break; }
      }
    }
    if (pick < 0) {
      for (let i = 0; i < p.hand.length; i += 1) {
        const card = CARD_BY_ID.get(p.hand[i]);
        if (card.cost <= p.energy) { pick = i; break; }
      }
    }
    if (pick < 0) return;
    if (CARD_BY_ID.get(p.hand[pick]).type === CARD_TYPE.GUARD) guard += CARD_BY_ID.get(p.hand[pick]).value;
    playPlayerCard(game, pick);
    if (game.phase !== PHASE.PLAY) return;
  }
}

/** Drive one full turn: the pilot plays, then the foe answers. */
function playTurn(game) {
  sensiblePilot(game);
  if (game.phase !== PHASE.PLAY) return;
  foeAct(game, chooseIntent);
}

/** Play until the duel ends (or the turn cap), with the pilot that never plays. */
function playPassive(game) {
  while (game.phase === PHASE.PLAY && game.turn <= 60) {
    foeAct(game, chooseIntent);
  }
}

/** Find a seed whose duel ends the way `want` says ('won' or 'lost'). */
function findSeed(want, startSeed) {
  for (let seed = startSeed; seed < startSeed + 60; seed += 1) {
    const game = createGame(seed);
    startDuel(game, chooseIntent);
    if (want === 'lost') {
      playPassive(game);
    } else {
      while (game.phase === PHASE.PLAY && game.turn <= 60) playTurn(game);
    }
    if (game.phase === (want === 'won' ? PHASE.WON : PHASE.LOST)) return game;
  }
  return null;
}

/**
 * Set up the named scene and return the game in it plus the screen to draw.
 * Names: title, play, win, loss (anything else is the title).
 */
export function stageShot(name, seed) {
  if (name === 'play') {
    // Find a seed that is still mid-duel after four turns: both fighters alive,
    // both hands full, so the frame shows a real table, not an ending.
    for (let s = seed; s < seed + 40; s += 1) {
      const game = createGame(s);
      startDuel(game, chooseIntent);
      for (let t = 0; t < 4 && game.phase === PHASE.PLAY; t += 1) playTurn(game);
      if (
        game.phase === PHASE.PLAY &&
        game.player.hp > 0 &&
        game.foe.hp > 0 &&
        game.player.hand.length >= 3 &&
        game.foe.hand.length >= 3
      ) {
        return { game, screen: SCREEN.PLAY };
      }
    }
    const game = createGame(seed);
    startDuel(game, chooseIntent);
    for (let t = 0; t < 3 && game.phase === PHASE.PLAY; t += 1) playTurn(game);
    return { game, screen: SCREEN.PLAY };
  }
  if (name === 'win') {
    const game = findSeed('won', seed);
    return { game: game ?? createGame(seed), screen: SCREEN.OVER };
  }
  if (name === 'loss') {
    const game = findSeed('lost', seed);
    return { game: game ?? createGame(seed), screen: SCREEN.OVER };
  }
  const game = createGame(seed);
  return { game, screen: SCREEN.TITLE };
}
