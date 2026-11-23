// The cards of Ember Sigils: every card's name, suit, cost, type and value.
// Types: strike (damage), guard (block that absorbs damage), surge (draw, heal
// or energy). A card's suit is its colour AND its drawn symbol; the text never
// carries the suit alone.
import { SUIT } from './config.js';

export const CARD_TYPE = {
  STRIKE: 'strike',
  GUARD: 'guard',
  SURGE: 'surge',
};

// value: damage for strike, block for guard, effect amount for surge.
// effect: what a surge card does — 'draw', 'heal' or 'energy'.
export const CARD_DEFS = [
  { id: 'cinder-slash', name: 'Cinder Slash', suit: SUIT.EMBER, cost: 1, type: CARD_TYPE.STRIKE, value: 4, text: 'Deal 4 damage.' },
  { id: 'wildfire', name: 'Wildfire', suit: SUIT.EMBER, cost: 2, type: CARD_TYPE.STRIKE, value: 7, text: 'Deal 7 damage.' },
  { id: 'ember-fan', name: 'Ember Fan', suit: SUIT.EMBER, cost: 1, type: CARD_TYPE.STRIKE, value: 3, text: 'Deal 3 damage.' },
  { id: 'flamebrand', name: 'Flamebrand', suit: SUIT.EMBER, cost: 2, type: CARD_TYPE.STRIKE, value: 5, text: 'Deal 5 damage.' },
  { id: 'kindle', name: 'Kindle', suit: SUIT.EMBER, cost: 0, type: CARD_TYPE.SURGE, value: 1, effect: 'energy', text: 'Gain 1 energy.' },
  { id: 'ice-wall', name: 'Ice Wall', suit: SUIT.FROST, cost: 1, type: CARD_TYPE.GUARD, value: 6, text: 'Gain 6 block.' },
  { id: 'glacier', name: 'Glacier', suit: SUIT.FROST, cost: 2, type: CARD_TYPE.GUARD, value: 10, text: 'Gain 10 block.' },
  { id: 'snowblind', name: 'Snowblind', suit: SUIT.FROST, cost: 1, type: CARD_TYPE.STRIKE, value: 2, text: 'Deal 2 damage.' },
  { id: 'frostbite', name: 'Frostbite', suit: SUIT.FROST, cost: 2, type: CARD_TYPE.STRIKE, value: 4, text: 'Deal 4 damage.' },
  { id: 'deep-breath', name: 'Deep Breath', suit: SUIT.FROST, cost: 1, type: CARD_TYPE.SURGE, value: 2, effect: 'draw', text: 'Draw 2 cards.' },
  { id: 'thorn-whip', name: 'Thorn Whip', suit: SUIT.THORN, cost: 1, type: CARD_TYPE.STRIKE, value: 3, text: 'Deal 3 damage.' },
  { id: 'bramble-shield', name: 'Bramble Shield', suit: SUIT.THORN, cost: 1, type: CARD_TYPE.GUARD, value: 5, text: 'Gain 5 block.' },
  { id: 'overgrowth', name: 'Overgrowth', suit: SUIT.THORN, cost: 2, type: CARD_TYPE.STRIKE, value: 6, text: 'Deal 6 damage.' },
  { id: 'seedling', name: 'Seedling', suit: SUIT.THORN, cost: 1, type: CARD_TYPE.SURGE, value: 4, effect: 'heal', text: 'Restore 4 life.' },
  { id: 'second-wind', name: 'Second Wind', suit: SUIT.THORN, cost: 2, type: CARD_TYPE.SURGE, value: 5, effect: 'heal', text: 'Restore 5 life.' },
];

export const CARD_BY_ID = new Map(CARD_DEFS.map((c) => [c.id, c]));

/** A fresh 30-card deck: two copies of every card, shuffled with `rand`. */
export function buildDeck(rand) {
  const deck = [];
  for (const def of CARD_DEFS) {
    deck.push(def.id, def.id);
  }
  // Shuffle with the seeded rand passed in (Fisher-Yates lives in random.js).
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
  return deck;
}
