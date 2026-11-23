// The rules of Ember Sigils: decks, hands, turns, damage, block, suit combos
// and the win/loss conditions. Pure logic — no drawing, no input, no sound.
import {
  COMBO, DRAW_AT_TURN_START, HAND_LIMIT, MAX_ENERGY, OPENING_HAND,
  START_HP, SUIT,
} from './config.js';
import { CARD_BY_ID, CARD_TYPE, buildDeck } from './cards.js';
import { createRandom } from './random.js';

export const PHASE = {
  TITLE: 'title',
  PLAY: 'play',
  WON: 'won',
  LOST: 'lost',
};

function makeFighter(deck) {
  return {
    hp: START_HP, maxHp: START_HP, block: 0, energy: 0,
    deck, hand: [], discard: [],
  };
}

/** A fresh game. `seed` fixes the shuffle and every later draw. */
export function createGame(seed) {
  const rand = createRandom(seed);
  const game = {
    seed,
    rand,
    turn: 1,
    phase: PHASE.TITLE,
    player: makeFighter(buildDeck(rand)),
    foe: makeFighter(buildDeck(rand)),
    // The foe's declared move for this round: { kind: 'strike'|'guard'|'surge', value, label }.
    intent: null,
    // Suits played by the player this turn, and which combos already fired.
    suitsPlayed: [],
    combosFired: [],
    log: [],
    floaters: [],
    score: 0,
    damageDealt: 0,
    combosTriggered: 0,
    cardsPlayed: 0,
    // Transient animation cues the renderer reads and clears.
    fx: [],
  };
  return game;
}

function drawCards(fighter, count, game) {
  for (let n = 0; n < count; n += 1) {
    if (fighter.hand.length >= HAND_LIMIT) return;
    if (fighter.deck.length === 0) {
      if (fighter.discard.length === 0) return;
      fighter.deck = fighter.discard;
      fighter.discard = [];
      for (let i = fighter.deck.length - 1; i > 0; i -= 1) {
        const j = Math.floor(game.rand() * (i + 1));
        const tmp = fighter.deck[i];
        fighter.deck[i] = fighter.deck[j];
        fighter.deck[j] = tmp;
      }
    }
    fighter.hand.push(fighter.deck.pop());
  }
}

export function logLine(game, text) {
  game.log.unshift(text);
  if (game.log.length > 5) game.log.length = 5;
}

export function addFloater(game, x, y, text, color) {
  game.floaters.push({ x, y, text, color, age: 0 });
}

/** Block absorbs damage first; the rest hits life. Returns damage that got through. */
export function dealDamage(game, target, amount, source) {
  const absorbed = Math.min(target.block, amount);
  target.block -= absorbed;
  const through = amount - absorbed;
  target.hp = Math.max(0, target.hp - through);
  if (source === 'player') game.damageDealt += through;
  return { absorbed, through };
}

function gainBlock(fighter, amount) {
  fighter.block += amount;
}

/** Start a fresh duel: opening hands, first turn, first intent. */
export function startDuel(game, chooseIntent) {
  game.phase = PHASE.PLAY;
  game.turn = 1;
  game.score = 0;
  game.damageDealt = 0;
  game.combosTriggered = 0;
  game.cardsPlayed = 0;
  game.log = [];
  game.floaters = [];
  game.fx = [];
  drawCards(game.player, OPENING_HAND, game);
  drawCards(game.foe, OPENING_HAND, game);
  beginPlayerTurn(game, chooseIntent);
}

/** The player's turn begins: energy refills, block fades, cards are drawn. */
export function beginPlayerTurn(game, chooseIntent) {
  const p = game.player;
  p.block = 0;
  p.energy = MAX_ENERGY;
  game.suitsPlayed = [];
  game.combosFired = [];
  drawCards(p, DRAW_AT_TURN_START, game);
  game.intent = chooseIntent(game);
  logLine(game, `Turn ${game.turn}: your move — the foe ${game.intent.label.toLowerCase()}.`);
}

/** Play the card at `handIndex` from the player's hand. Returns true when played. */
export function playPlayerCard(game, handIndex) {
  if (game.phase !== PHASE.PLAY) return false;
  const p = game.player;
  const cardId = p.hand[handIndex];
  if (cardId === undefined) return false;
  const card = CARD_BY_ID.get(cardId);
  if (p.energy < card.cost) return false;
  p.energy -= card.cost;
  p.hand.splice(handIndex, 1);
  p.discard.push(cardId);
  game.cardsPlayed += 1;
  game.fx.push({ kind: 'played', card, by: 'player' });
  applyCard(game, card, p, game.foe, 'player');
  game.suitsPlayed.push(card.suit);
  checkCombo(game, card.suit);
  if (game.foe.hp <= 0) return endDuel(game, true);
  if (p.hp <= 0) return endDuel(game, false);
  return true;
}

function applyCard(game, card, self, target, by) {
  if (card.type === CARD_TYPE.STRIKE) {
    let amount = card.value;
    if (by === 'player' && game.combosFired.includes(SUIT.EMBER)) amount += COMBO.ember.damageBonus;
    const result = dealDamage(game, target, amount, by);
    logLine(game, `${by === 'player' ? 'You play' : 'Foe plays'} ${card.name}: ${amount} damage${result.absorbed > 0 ? ` (${result.absorbed} blocked)` : ''}.`);
    game.fx.push({ kind: 'hit', by, amount: result.through, blocked: result.absorbed });
  } else if (card.type === CARD_TYPE.GUARD) {
    gainBlock(self, card.value);
    logLine(game, `${by === 'player' ? 'You play' : 'Foe plays'} ${card.name}: +${card.value} block.`);
    game.fx.push({ kind: 'block', by, amount: card.value });
  } else {
    if (card.effect === 'draw') {
      drawCards(self, card.value, game);
      logLine(game, `${by === 'player' ? 'You play' : 'Foe plays'} ${card.name}: draw ${card.value}.`);
    } else if (card.effect === 'heal') {
      const healed = Math.min(card.value, self.maxHp - self.hp);
      self.hp += healed;
      logLine(game, `${by === 'player' ? 'You play' : 'Foe plays'} ${card.name}: restore ${healed} life.`);
    } else if (card.effect === 'energy') {
      self.energy += card.value;
      logLine(game, `${by === 'player' ? 'You play' : 'Foe plays'} ${card.name}: +${card.value} energy.`);
    }
    game.fx.push({ kind: 'surge', by, card });
  }
}

/** Two cards of one suit in a turn fire that suit's bonus, once per turn. */
export function checkCombo(game, suit) {
  if (game.combosFired.includes(suit)) return;
  const count = game.suitsPlayed.filter((s) => s === suit).length;
  if (count < 2) return;
  game.combosFired.push(suit);
  game.combosTriggered += 1;
  const combo = COMBO[suit];
  logLine(game, `Suit combo — ${combo.label}!`);
  game.fx.push({ kind: 'combo', suit });
  if (combo.blockBonus) gainBlock(game.player, combo.blockBonus);
  if (combo.drawBonus) drawCards(game.player, combo.drawBonus, game);
}

/** The foe acts on the intent it declared: draws, spends energy, plays cards. */
export function foeAct(game, chooseIntent) {
  const foe = game.foe;
  foe.block = 0;
  foe.energy = MAX_ENERGY;
  drawCards(foe, DRAW_AT_TURN_START, game);
  const intent = game.intent;
  // Play cards that serve the intent, cheapest useful first, until out of energy.
  let guard = 0;
  while (foe.energy > 0) {
    const idx = chooseFoeCard(game, intent);
    if (idx < 0) break;
    const cardId = foe.hand[idx];
    const card = CARD_BY_ID.get(cardId);
    foe.energy -= card.cost;
    foe.hand.splice(idx, 1);
    foe.discard.push(cardId);
    game.fx.push({ kind: 'played', card, by: 'foe' });
    applyCard(game, card, foe, game.player, 'foe');
    if (card.type === CARD_TYPE.GUARD) guard += card.value;
    if (game.player.hp <= 0) return endDuel(game, false);
    if (foe.hp <= 0) return endDuel(game, true);
    if (guard > 0 && intent.kind === 'guard' && guard >= intent.value) break;
  }
  if (game.phase !== PHASE.PLAY) return true;
  game.turn += 1;
  beginPlayerTurn(game, chooseIntent);
  return true;
}

/** Pick the foe's next card for its declared intent, or -1 to stop. */
function chooseFoeCard(game, intent) {
  const foe = game.foe;
  let best = -1;
  let bestScore = -1;
  for (let i = 0; i < foe.hand.length; i += 1) {
    const card = CARD_BY_ID.get(foe.hand[i]);
    if (card.cost > foe.energy) continue;
    let score = 0;
    if (intent.kind === 'strike' && card.type === CARD_TYPE.STRIKE) score = card.value * 2 - card.cost;
    if (intent.kind === 'guard' && card.type === CARD_TYPE.GUARD) score = card.value * 2 - card.cost;
    if (intent.kind === 'surge' && card.type === CARD_TYPE.SURGE) score = card.value * 2 - card.cost;
    if (intent.kind === 'strike' && card.type === CARD_TYPE.SURGE && card.effect === 'energy') score = 3;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return bestScore > 0 ? best : -1;
}

function endDuel(game, won) {
  game.phase = won ? PHASE.WON : PHASE.LOST;
  const winBonus = won ? 100 + Math.max(0, 12 - game.turn) * 5 : 0;
  game.score = game.damageDealt + game.combosTriggered * 5 + winBonus;
  logLine(game, won ? `Victory in ${game.turn} turns!` : `Defeated on turn ${game.turn}.`);
  game.fx.push({ kind: won ? 'win' : 'lose' });
  return true;
}

/** Score shown on the table: points so far plus the win bonus when the duel ends. */
export function currentScore(game) {
  return game.phase === PHASE.PLAY
    ? game.damageDealt + game.combosTriggered * 5
    : game.score;
}
