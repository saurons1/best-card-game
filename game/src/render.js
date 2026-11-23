// Drawing for Ember Sigils: the table, the hands, the cards, the HUD and every
// screen. Canvas 2D only, no images — every suit symbol is drawn with paths,
// so suits are told apart by colour AND shape, never by text alone.
import { H, MAX_ENERGY, SUIT_STYLE, W } from './config.js';
import { CARD_BY_ID, CARD_TYPE } from './cards.js';
import { PHASE, currentScore } from './state.js';

export const SCREEN = {
  TITLE: 'title',
  PLAY: 'play',
  PAUSED: 'paused',
  OVER: 'over',
};

const CARD_W = 122;
const CARD_H = 168;
const FOE_CARD_W = 64;
const FOE_CARD_H = 88;

// ---- small canvas helpers -------------------------------------------------

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, font, color, align = 'center') {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

/** The suit's drawn symbol: flame, snowflake or leaf. Shape, not text. */
export function drawSuitSymbol(ctx, suit, cx, cy, size, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.lineCap = 'round';
  if (suit === 'ember') {
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.55);
    ctx.bezierCurveTo(size * 0.45, -size * 0.1, size * 0.4, size * 0.35, 0, size * 0.55);
    ctx.bezierCurveTo(-size * 0.4, size * 0.35, -size * 0.45, -size * 0.1, 0, -size * 0.55);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, size * 0.4);
    ctx.bezierCurveTo(size * 0.16, size * 0.2, size * 0.14, -size * 0.05, 0, -size * 0.25);
    ctx.bezierCurveTo(-size * 0.14, -size * 0.05, -size * 0.16, size * 0.2, 0, size * 0.4);
    ctx.fillStyle = '#ffd23e';
    ctx.fill();
  } else if (suit === 'frost') {
    for (let i = 0; i < 3; i += 1) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(-Math.cos(a) * size * 0.55, -Math.sin(a) * size * 0.55);
      ctx.lineTo(Math.cos(a) * size * 0.55, Math.sin(a) * size * 0.55);
      ctx.stroke();
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(s * Math.cos(a) * size * 0.3, s * Math.sin(a) * size * 0.3);
        ctx.lineTo(s * Math.cos(a) * size * 0.3 - Math.cos(a + 0.6) * size * 0.18, s * Math.sin(a) * size * 0.3 - Math.sin(a + 0.6) * size * 0.18);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * Math.cos(a) * size * 0.3, s * Math.sin(a) * size * 0.3);
        ctx.lineTo(s * Math.cos(a) * size * 0.3 - Math.cos(a - 0.6) * size * 0.18, s * Math.sin(a) * size * 0.3 - Math.sin(a - 0.6) * size * 0.18);
        ctx.stroke();
      }
    }
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.55);
    ctx.bezierCurveTo(size * 0.5, -size * 0.25, size * 0.45, size * 0.35, 0, size * 0.55);
    ctx.bezierCurveTo(-size * 0.45, size * 0.35, -size * 0.5, -size * 0.25, 0, -size * 0.55);
    ctx.fill();
    ctx.strokeStyle = '#d2f5b8';
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.45);
    ctx.lineTo(0, size * 0.45);
    ctx.stroke();
  }
  ctx.restore();
}

/** A card's type mark: sword (strike), shield (guard), spark (surge). */
function drawTypeMark(ctx, type, cx, cy, size, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.1);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (type === CARD_TYPE.STRIKE) {
    ctx.beginPath();
    ctx.moveTo(-size * 0.4, size * 0.45);
    ctx.lineTo(size * 0.35, -size * 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size * 0.35, -size * 0.4);
    ctx.lineTo(size * 0.5, -size * 0.5);
    ctx.lineTo(size * 0.15, -size * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-size * 0.5, size * 0.35);
    ctx.lineTo(-size * 0.25, size * 0.55);
    ctx.stroke();
  } else if (type === CARD_TYPE.GUARD) {
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.5);
    ctx.lineTo(size * 0.45, -size * 0.25);
    ctx.lineTo(size * 0.4, size * 0.2);
    ctx.quadraticCurveTo(size * 0.3, size * 0.5, 0, size * 0.55);
    ctx.quadraticCurveTo(-size * 0.3, size * 0.5, -size * 0.4, size * 0.2);
    ctx.lineTo(-size * 0.45, -size * 0.25);
    ctx.closePath();
    ctx.stroke();
  } else {
    for (let i = 0; i < 4; i += 1) {
      const a = (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * size * 0.5, Math.sin(a) * size * 0.5);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.14, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---- layout ----------------------------------------------------------------

/** Map a client point to the game's logical 1280x720 space, undoing the
 * letterbox the renderer applies when the window is not 16:9. Without this,
 * clicks land in the wrong place on a window whose aspect differs. */
export function toLogical(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(canvas.width / W, canvas.height / H);
  const ox = (canvas.width - W * scale) / 2;
  const oy = (canvas.height - H * scale) / 2;
  return {
    x: ((clientX - rect.left) * (canvas.width / rect.width) - ox) / scale,
    y: ((clientY - rect.top) * (canvas.height / rect.height) - oy) / scale,
  };
}

export function handRects(game) {
  const n = game.player.hand.length;
  const total = Math.min(n * (CARD_W + 6) - 6, 780);
  const step = n > 1 ? (total - CARD_W) / (n - 1) : 0;
  const x0 = W / 2 - total / 2;
  const y = H - CARD_H - 18;
  return game.player.hand.map((_, i) => ({
    x: x0 + i * step,
    y,
    w: CARD_W,
    h: CARD_H,
    cx: x0 + i * step + CARD_W / 2,
  }));
}

export function endTurnRect() {
  return { x: W - 218, y: H - 108, w: 178, h: 56 };
}

export function titlePlayRect() {
  return { x: W / 2 - 130, y: 486, w: 260, h: 64 };
}

export function restartRect() {
  return { x: W / 2 - 150, y: 520, w: 300, h: 60 };
}

/** What is under point (x, y) on this screen: card index, end turn, or a button. */
export function hitTest(game, screen, x, y) {
  if (screen === SCREEN.TITLE) {
    const r = titlePlayRect();
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return { kind: 'play' };
    return null;
  }
  if (screen === SCREEN.OVER) {
    const r = restartRect();
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return { kind: 'restart' };
    return null;
  }
  if (screen !== SCREEN.PLAY) return null;
  const et = endTurnRect();
  if (x >= et.x && x <= et.x + et.w && y >= et.y && y <= et.y + et.h) return { kind: 'endturn' };
  const rects = handRects(game);
  for (let i = rects.length - 1; i >= 0; i -= 1) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return { kind: 'card', index: i };
  }
  return null;
}

// ---- the renderer ----------------------------------------------------------

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const positions = new Map(); // hand key -> {x, y} for sliding cards
  let tablePattern = null;

  function ensurePattern() {
    if (tablePattern) return;
    const c = document.createElement('canvas');
    c.width = 96;
    c.height = 96;
    const g = c.getContext('2d');
    g.strokeStyle = 'rgba(255,255,255,0.03)';
    g.lineWidth = 1;
    g.beginPath();
    g.arc(48, 48, 30, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.arc(48, 48, 12, 0, Math.PI * 2);
    g.stroke();
    tablePattern = ctx.createPattern(c, 'repeat');
  }

  function drawTable() {
    ensurePattern();
    const grad = ctx.createRadialGradient(W / 2, H / 2 - 60, 80, W / 2, H / 2, 900);
    grad.addColorStop(0, '#1d4a2f');
    grad.addColorStop(0.6, '#12351f');
    grad.addColorStop(1, '#0a1f12');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = tablePattern;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(212,175,55,0.55)';
    ctx.lineWidth = 3;
    roundRect(ctx, 10, 10, W - 20, H - 20, 18);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(212,175,55,0.18)';
    ctx.lineWidth = 1;
    roundRect(ctx, 22, 22, W - 44, H - 44, 12);
    ctx.stroke();
  }

  function drawHpBar(x, y, w, hp, maxHp, block, alignRight) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(ctx, x, y, w, 24, 12);
    ctx.fill();
    const frac = Math.max(0, hp / maxHp);
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, '#ff6b4a');
    grad.addColorStop(1, '#ffb03a');
    ctx.fillStyle = grad;
    if (frac > 0) {
      roundRect(ctx, x + 2, y + 2, Math.max(10, (w - 4) * frac), 20, 10);
      ctx.fill();
    }
    text(ctx, `${hp} / ${maxHp}`, x + w / 2, y + 13, 'bold 15px Georgia, serif', '#fff');
    if (block > 0) {
      const bx = alignRight ? x - 44 : x + w + 8;
      ctx.fillStyle = '#4fc3ff';
      ctx.beginPath();
      ctx.moveTo(bx + 16, y - 2);
      ctx.lineTo(bx + 30, y + 4);
      ctx.lineTo(bx + 28, y + 18);
      ctx.quadraticCurveTo(bx + 24, y + 28, bx + 16, y + 30);
      ctx.quadraticCurveTo(bx + 8, y + 28, bx + 4, y + 18);
      ctx.lineTo(bx + 2, y + 4);
      ctx.closePath();
      ctx.fill();
      text(ctx, String(block), bx + 16, y + 14, 'bold 15px Georgia, serif', '#06283d');
    }
  }

  function drawPortrait(cx, cy, r, label, isFoe) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = isFoe ? '#3d1a2e' : '#1a2e3d';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = isFoe ? '#ff5a3c' : '#4fc3ff';
    ctx.stroke();
    ctx.clip();
    // A hooded figure, drawn in two arcs: hood and shoulders.
    ctx.fillStyle = isFoe ? '#ff8a6b' : '#9adcff';
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.15, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isFoe ? '#5a2438' : '#274b63';
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.85, r * 0.75, Math.PI, 0);
    ctx.fill();
    ctx.restore();
    text(ctx, label, cx, cy + r + 16, 'bold 13px Georgia, serif', '#e8dcc0');
  }

  function drawCardBack(x, y, w, h) {
    ctx.fillStyle = '#241a33';
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    roundRect(ctx, x + 3, y + 3, w - 6, h - 6, 6);
    ctx.stroke();
    drawSuitSymbol(ctx, 'ember', x + w / 2, y + h / 2, Math.min(w, h) * 0.32, '#d4af37');
  }

  function drawCard(card, x, y, w, h, opts = {}) {
    const style = SUIT_STYLE[card.suit];
    const affordable = opts.affordable !== false;
    const hover = opts.hover === true;
    ctx.save();
    if (hover) {
      ctx.shadowColor = 'rgba(255,220,120,0.7)';
      ctx.shadowBlur = 22;
    } else {
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;
    }
    ctx.fillStyle = '#f5eeda';
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.restore();
    ctx.lineWidth = 4;
    ctx.strokeStyle = style.color;
    roundRect(ctx, x, y, w, h, 10);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = style.dark;
    roundRect(ctx, x + 5, y + 5, w - 10, h - 10, 7);
    ctx.stroke();
    if (!affordable) {
      ctx.fillStyle = 'rgba(20,10,20,0.45)';
      roundRect(ctx, x, y, w, h, 10);
      ctx.fill();
    }
    // Cost gem, top left.
    ctx.fillStyle = '#2b1d4e';
    ctx.beginPath();
    ctx.arc(x + 20, y + 20, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffd23e';
    ctx.stroke();
    text(ctx, String(card.cost), x + 20, y + 21, 'bold 18px Georgia, serif', '#ffd23e');
    // Suit symbol, top right.
    drawSuitSymbol(ctx, card.suit, x + w - 22, y + 21, 15, style.color);
    // Name.
    text(ctx, card.name, x + w / 2, y + 52, 'bold 14px Georgia, serif', '#241a33');
    // Big value with its type mark.
    drawTypeMark(ctx, card.type, x + w / 2, y + 92, 30, style.dark);
    text(ctx, String(card.value), x + w / 2, y + 126, 'bold 26px Georgia, serif', '#241a33');
    // Text.
    text(ctx, card.text, x + w / 2, y + h - 16, '11px Georgia, serif', '#5a4a33');
  }

  function drawFoeHand(game) {
    const n = game.foe.hand.length;
    const total = Math.min(n * (FOE_CARD_W - 18), 420);
    const x0 = W - 200 - total;
    for (let i = 0; i < n; i += 1) {
      const x = x0 + (i * (total - FOE_CARD_W)) / Math.max(1, n - 1 || 1);
      drawCardBack(x, 26, FOE_CARD_W, FOE_CARD_H);
    }
    text(ctx, `${n} cards`, W - 200 - total / 2, 132, '12px Georgia, serif', '#cbb98a');
  }

  function drawEnergy(p, x, y) {
    for (let i = 0; i < MAX_ENERGY; i += 1) {
      const cx = x + i * 34;
      ctx.save();
      ctx.translate(cx, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = i < p.energy ? '#ffd23e' : 'rgba(255,255,255,0.15)';
      ctx.strokeStyle = '#7a5c00';
      ctx.lineWidth = 2;
      ctx.fillRect(-10, -10, 20, 20);
      ctx.strokeRect(-10, -10, 20, 20);
      ctx.restore();
    }
    text(ctx, 'ENERGY', x + 50, y + 26, 'bold 11px Georgia, serif', '#e8dcc0');
  }

  function drawIntent(game) {
    const intent = game.intent;
    if (!intent) return;
    const cx = W / 2;
    const y = 150;
    ctx.fillStyle = 'rgba(20,12,28,0.85)';
    roundRect(ctx, cx - 210, y, 420, 44, 22);
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    roundRect(ctx, cx - 210, y, 420, 44, 22);
    ctx.stroke();
    const icon = intent.kind === 'strike' ? '⚔' : intent.kind === 'guard' ? '⛨' : '✦';
    text(ctx, `FOE ${icon} ${intent.label}`, cx, y + 23, 'bold 17px Georgia, serif', '#ffe9a8');
  }

  function drawLog(game) {
    ctx.textAlign = 'left';
    game.log.slice(0, 4).forEach((line, i) => {
      text(ctx, line, 44, 300 + i * 22, '13px Georgia, serif', `rgba(232,220,192,${1 - i * 0.22})`, 'left');
    });
    ctx.textAlign = 'center';
  }

  function drawComboBanner(game, time) {
    const combo = game.combosFired[game.combosFired.length - 1];
    if (!combo) return;
    const style = SUIT_STYLE[combo];
    const pulse = 1 + Math.sin(time / 180) * 0.04;
    ctx.save();
    ctx.translate(W / 2, 216);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = style.dark;
    roundRect(ctx, -190, -18, 380, 36, 18);
    ctx.fill();
    ctx.strokeStyle = style.light;
    ctx.lineWidth = 2;
    roundRect(ctx, -190, -18, 380, 36, 18);
    ctx.stroke();
    drawSuitSymbol(ctx, combo, -168, 0, 13, style.light);
    text(ctx, `SUIT COMBO — ${style.name.toUpperCase()}!`, 8, 1, 'bold 16px Georgia, serif', '#fff');
    ctx.restore();
  }

  function drawPlayScreen(game, ui) {
    drawTable();
    // Foe: portrait + HP + hand.
    drawPortrait(92, 66, 38, 'ASHEN WARDEN', true);
    drawHpBar(150, 54, 380, game.foe.hp, game.foe.maxHp, game.foe.block, false);
    drawFoeHand(game);
    drawIntent(game);
    drawLog(game);
    // Centre: the sigil circle where played cards land.
    ctx.strokeStyle = 'rgba(212,175,55,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(W / 2, 330, 74, 0, Math.PI * 2);
    ctx.stroke();
    drawSuitSymbol(ctx, 'ember', W / 2, 330, 34, 'rgba(255,90,60,0.25)');
    drawSuitSymbol(ctx, 'frost', W / 2 - 44, 330, 26, 'rgba(79,195,255,0.25)');
    drawSuitSymbol(ctx, 'thorn', W / 2 + 44, 330, 26, 'rgba(126,217,87,0.25)');
    text(ctx, 'THE TABLE', W / 2, 424, 'bold 12px Georgia, serif', 'rgba(203,185,138,0.7)');
    drawComboBanner(game, ui.time);
    // Played-card flourish.
    if (ui.played) {
      const a = ui.played;
      const p = Math.min(1, a.age / 500);
      const y = 330 - p * 40;
      ctx.save();
      ctx.globalAlpha = 1 - p * p;
      const scale = 0.55 + 0.45 * Math.sin(Math.min(1, p * 1.4) * (Math.PI / 2));
      ctx.translate(W / 2, y);
      ctx.scale(scale, scale);
      drawCard(a.card, -CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, { affordable: true });
      ctx.restore();
    }
    // Floaters (damage numbers).
    for (const f of game.floaters) {
      const p = f.age / 900;
      if (p >= 1) continue;
      ctx.save();
      ctx.globalAlpha = 1 - p;
      text(ctx, f.text, f.x, f.y - p * 46, 'bold 26px Georgia, serif', f.color);
      ctx.restore();
    }
    // Player: portrait + HP above the hand (the hand's first card starts at
    // x >= 250, so this left column stays clear), energy pips below it.
    drawPortrait(80, 490, 30, 'YOU', false);
    drawHpBar(125, 478, 300, game.player.hp, game.player.maxHp, game.player.block, false);
    drawEnergy(game.player, 150, 668);
    text(ctx, `TURN ${game.turn}  ·  SCORE ${currentScore(game)}  ·  BEST ${ui.best}`, 125, 522, 'bold 15px Georgia, serif', '#e8dcc0', 'left');
    text(ctx, ui.soundMuted ? 'M — sound off' : 'M — sound on', 125, 545, '12px Georgia, serif', '#8a7f66', 'left');
    // Deck and discard piles, right of the table.
    drawCardBack(1148, 270, FOE_CARD_W, FOE_CARD_H);
    text(ctx, `DECK ${game.player.deck.length}`, 1180, 372, 'bold 13px Georgia, serif', '#e8dcc0');
    drawCardBack(1148, 400, FOE_CARD_W, FOE_CARD_H);
    text(ctx, `DISCARD ${game.player.discard.length}`, 1180, 502, '12px Georgia, serif', '#cbb98a');
    // End Turn button.
    const et = endTurnRect();
    ctx.fillStyle = '#7a2e12';
    roundRect(ctx, et.x, et.y, et.w, et.h, 12);
    ctx.fill();
    ctx.strokeStyle = '#ffd23e';
    ctx.lineWidth = 2;
    roundRect(ctx, et.x, et.y, et.w, et.h, 12);
    ctx.stroke();
    text(ctx, 'END TURN', et.x + et.w / 2, et.y + et.h / 2 - 8, 'bold 18px Georgia, serif', '#ffe9a8');
    text(ctx, 'Space', et.x + et.w / 2, et.y + et.h / 2 + 14, '12px Georgia, serif', '#cbb98a');
    // Player hand, sliding toward its layout spots.
    const rects = handRects(game);
    game.player.hand.forEach((id, i) => {
      const card = CARD_BY_ID.get(id);
      const r = rects[i];
      const key = `${id}:${i}`;
      let pos = positions.get(key);
      if (!pos) {
        pos = { x: 1180, y: 300 };
        positions.set(key, pos);
      }
      const targetY = r.y - (ui.hoverCard === i ? 26 : 0);
      if (ui.snap) {
        pos.x = r.x;
        pos.y = targetY;
      } else {
        const k = 0.22;
        pos.x += (r.x - pos.x) * k;
        pos.y += (targetY - pos.y) * k;
      }
      const affordable = card.cost <= game.player.energy;
      drawCard(card, pos.x, pos.y, CARD_W, CARD_H, { affordable, hover: ui.hoverCard === i });
      if (ui.hoverCard === i) {
        text(ctx, `${i + 1}`, pos.x + CARD_W / 2, pos.y + CARD_H + 14, 'bold 12px Georgia, serif', '#ffd23e');
      }
    });
    // Drop stale positions for cards that left the hand.
    for (const key of [...positions.keys()]) {
      if (!game.player.hand.some((id, i) => `${id}:${i}` === key)) positions.delete(key);
    }
    text(ctx, 'Click a card or press 1–7 to play it · Space ends the turn', W / 2, H - 8, '12px Georgia, serif', 'rgba(203,185,138,0.75)');
  }

  function drawTitleScreen(game, ui) {
    drawTable();
    // Three sigils above the title.
    drawSuitSymbol(ctx, 'ember', W / 2 - 120, 150, 46, '#ff5a3c');
    drawSuitSymbol(ctx, 'frost', W / 2, 138, 46, '#4fc3ff');
    drawSuitSymbol(ctx, 'thorn', W / 2 + 120, 150, 46, '#7ed957');
    text(ctx, 'EMBER SIGILS', W / 2, 250, 'bold 84px Georgia, serif', '#ffe9a8');
    ctx.strokeStyle = 'rgba(212,175,55,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 260, 292);
    ctx.lineTo(W / 2 + 260, 292);
    ctx.stroke();
    text(ctx, 'A duel of three suits — outplay the Ashen Warden', W / 2, 322, 'italic 22px Georgia, serif', '#e8dcc0');
    const r = titlePlayRect();
    ctx.fillStyle = '#7a2e12';
    roundRect(ctx, r.x, r.y, r.w, r.h, 14);
    ctx.fill();
    ctx.strokeStyle = '#ffd23e';
    ctx.lineWidth = 3;
    roundRect(ctx, r.x, r.y, r.w, r.h, 14);
    ctx.stroke();
    text(ctx, '▶  PLAY', r.x + r.w / 2, r.y + r.h / 2, 'bold 26px Georgia, serif', '#ffe9a8');
    text(ctx, 'How to play', W / 2, 592, 'bold 16px Georgia, serif', '#ffd23e');
    text(ctx, 'Each turn you gain 3 energy and draw 2 cards. Play cards to strike, guard or surge.', W / 2, 618, '15px Georgia, serif', '#e8dcc0');
    text(ctx, 'Play two cards of one suit in a turn to fire its combo: Ember +3 damage, Frost +4 block, Thorn draws a card.', W / 2, 642, '15px Georgia, serif', '#e8dcc0');
    text(ctx, 'The Warden declares its intent — read it, then counter it. Reduce it to 0 life to win.', W / 2, 666, '15px Georgia, serif', '#e8dcc0');
    text(ctx, 'Mouse or keys 1–7 play a card · Space ends the turn · M mutes · P pauses', W / 2, 696, '13px Georgia, serif', '#8a7f66');
    if (ui.best > 0) text(ctx, `Best score: ${ui.best}`, W / 2, 560, 'bold 15px Georgia, serif', '#ffd23e');
    // A sample hand fanned under the title, for the cover's sake.
    const sample = ['cinder-slash', 'ice-wall', 'thorn-whip', 'wildfire', 'seedling'];
    sample.forEach((id, i) => {
      const card = CARD_BY_ID.get(id);
      const x = W / 2 - 300 + i * 125;
      ctx.save();
      ctx.translate(x + CARD_W / 2, 330 + CARD_H / 2);
      ctx.rotate((i - 2) * 0.05);
      ctx.scale(0.72, 0.72);
      drawCard(card, -CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, { affordable: true });
      ctx.restore();
    });
  }

  function drawOverScreen(game, ui, won) {
    drawTable();
    // Confetti embers on a win.
    if (won) {
      for (let i = 0; i < 40; i += 1) {
        const x = (i * 173 + 60) % W;
        const y = ((i * 97 + Math.floor(ui.time / 30)) % 300) + 40;
        ctx.fillStyle = ['#ff5a3c', '#ffd23e', '#ff8a6b'][i % 3];
        ctx.beginPath();
        ctx.arc(x, y, 3 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    text(ctx, won ? 'VICTORY' : 'DEFEAT', W / 2, 210, 'bold 92px Georgia, serif', won ? '#ffd23e' : '#8a7f66');
    text(
      ctx,
      won ? 'The Ashen Warden kneels. The sigils are yours.' : 'The Warden stands over the table. The sigils dim.',
      W / 2, 300, 'italic 22px Georgia, serif', '#e8dcc0',
    );
    text(ctx, `Score: ${game.score}`, W / 2, 360, 'bold 28px Georgia, serif', '#fff');
    text(
      ctx,
      `Turns: ${game.turn} · Damage dealt: ${game.damageDealt} · Suit combos: ${game.combosTriggered} · Cards played: ${game.cardsPlayed}`,
      W / 2, 400, '16px Georgia, serif', '#cbb98a',
    );
    if (game.score > ui.best) text(ctx, 'New best score!', W / 2, 440, 'bold 20px Georgia, serif', '#ffd23e');
    const r = restartRect();
    ctx.fillStyle = '#7a2e12';
    roundRect(ctx, r.x, r.y, r.w, r.h, 14);
    ctx.fill();
    ctx.strokeStyle = '#ffd23e';
    ctx.lineWidth = 3;
    roundRect(ctx, r.x, r.y, r.w, r.h, 14);
    ctx.stroke();
    text(ctx, won ? '↻  PLAY AGAIN' : '↻  TRY AGAIN', r.x + r.w / 2, r.y + r.h / 2, 'bold 22px Georgia, serif', '#ffe9a8');
    text(ctx, 'Enter to play again · Esc for the title', W / 2, 600, '14px Georgia, serif', '#8a7f66');
  }

  function drawPausedScreen() {
    ctx.fillStyle = 'rgba(10,6,16,0.82)';
    ctx.fillRect(0, 0, W, H);
    text(ctx, 'PAUSED', W / 2, 330, 'bold 64px Georgia, serif', '#ffe9a8');
    text(ctx, 'P to resume · Esc for the title', W / 2, 400, '18px Georgia, serif', '#e8dcc0');
  }

  return {
    draw(game, screen, ui) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const scale = Math.min(canvas.width / W, canvas.height / H);
      ctx.setTransform(scale, 0, 0, scale, (canvas.width - W * scale) / 2, (canvas.height - H * scale) / 2);
      if (screen === SCREEN.TITLE) drawTitleScreen(game, ui);
      else if (screen === SCREEN.OVER) drawOverScreen(game, ui, game.phase === PHASE.WON);
      else {
        drawPlayScreen(game, ui);
        if (screen === SCREEN.PAUSED) drawPausedScreen();
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    },
  };
}
