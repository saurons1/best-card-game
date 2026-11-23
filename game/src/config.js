// Shared constants for Ember Sigils: the numbers that shape every duel.
export const W = 1280;
export const H = 720;

export const START_HP = 20;
export const MAX_ENERGY = 3;
export const HAND_LIMIT = 7;
export const DRAW_AT_TURN_START = 2;
export const OPENING_HAND = 5;

// Suits: each is told apart by colour AND by its drawn symbol, never by text alone.
export const SUIT = {
  EMBER: 'ember',
  FROST: 'frost',
  THORN: 'thorn',
};

export const SUIT_STYLE = {
  ember: { color: '#ff5a3c', dark: '#a32a12', light: '#ffb199', name: 'Ember', glyph: 'flame' },
  frost: { color: '#4fc3ff', dark: '#155a86', light: '#bfe9ff', name: 'Frost', glyph: 'flake' },
  thorn: { color: '#7ed957', dark: '#2c6b1e', light: '#d2f5b8', name: 'Thorn', glyph: 'leaf' },
};

// Playing two cards of one suit in a turn triggers that suit's bonus once.
export const COMBO = {
  ember: { label: 'Ember surge: +3 damage on your strikes this turn', damageBonus: 3 },
  frost: { label: 'Frost surge: +4 block', blockBonus: 4 },
  thorn: { label: 'Thorn surge: draw a card', drawBonus: 1 },
};

export const BEST_KEY = 'ember-sigils-best-score';
export const MUTE_KEY = 'ember-sigils-muted';
