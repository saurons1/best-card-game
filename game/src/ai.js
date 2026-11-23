// The foe's mind: it declares its intent at the start of your turn, so you can
// read it and counter it, then it acts on that intent when your turn ends.
import { CARD_BY_ID, CARD_TYPE } from './cards.js';
import { MAX_ENERGY } from './config.js';

/** The foe's hand, summed by what it can do with 3 energy. */
function handPower(hand) {
  let strike = 0;
  let guard = 0;
  let heal = 0;
  for (const id of hand) {
    const card = CARD_BY_ID.get(id);
    if (card.type === CARD_TYPE.STRIKE) strike += card.value;
    if (card.type === CARD_TYPE.GUARD) guard += card.value;
    if (card.type === CARD_TYPE.SURGE && card.effect === 'heal') heal += card.value;
  }
  return { strike, guard, heal };
}

/**
 * Declare what the foe will do this round. The declaration is shown on the
 * table before the foe acts, so the player can read it and counter it.
 */
export function chooseIntent(game) {
  const foe = game.foe;
  const player = game.player;
  const power = handPower(foe.hand);
  const bestStrike = bestAffordable(foe.hand, CARD_TYPE.STRIKE);
  const bestGuard = bestAffordable(foe.hand, CARD_TYPE.GUARD);
  const bestSurge = bestAffordable(foe.hand, CARD_TYPE.SURGE);

  // Hurt and holding a cure: heal first.
  if (foe.hp <= 8 && bestSurge && bestSurge.effect === 'heal') {
    return { kind: 'surge', value: bestSurge.value, label: `will mend ${bestSurge.value} life` };
  }
  // Your shield is up and the foe can break through: it swings.
  if (player.block >= 6 && bestStrike) {
    return { kind: 'strike', value: bestStrike.value, label: `will strike for ${bestStrike.value}` };
  }
  // The foe is low and can hide: it guards.
  if (foe.hp <= 10 && bestGuard && power.guard >= 8) {
    return { kind: 'guard', value: bestGuard.value, label: `will guard for ${bestGuard.value}` };
  }
  // Otherwise it takes the biggest swing it can afford.
  if (bestStrike) {
    return { kind: 'strike', value: bestStrike.value, label: `will strike for ${bestStrike.value}` };
  }
  if (bestGuard) {
    return { kind: 'guard', value: bestGuard.value, label: `will guard for ${bestGuard.value}` };
  }
  if (bestSurge) {
    return { kind: 'surge', value: bestSurge.value, label: `will play ${bestSurge.name}` };
  }
  return { kind: 'strike', value: 0, label: 'will hold its cards' };
}

/** The strongest card of a type the foe can afford with its energy. */
function bestAffordable(hand, type) {
  let best = null;
  for (const id of hand) {
    const card = CARD_BY_ID.get(id);
    if (card.type !== type || card.cost > MAX_ENERGY) continue;
    if (!best || card.value > best.value) best = card;
  }
  return best;
}
