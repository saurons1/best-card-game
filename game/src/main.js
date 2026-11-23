// Boot and the one loop: input is read as events, the world advances only when
// a card is played or a turn ends, and the renderer paints what is there. The
// game moves between four screens: title, play, paused and over (win / loss).
//
// ?seed=N fixes the shuffle. ?shot=title|play|win|loss (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY } from './config.js';
import { PHASE, createGame, currentScore, foeAct, playPlayerCard, startDuel } from './state.js';
import { chooseIntent } from './ai.js';
import { createInput } from './input.js';
import { SCREEN, createRenderer, hitTest } from './render.js';
import { stageShot } from './shots.js';
import { createSound } from './sound.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const sound = createSound();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function fitCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

const renderer = createRenderer(canvas);

function runShot(name) {
  const staged = stageShot(name, seed);
  const game = staged.game;
  const ui = { hoverCard: -1, time: 0, best: readBest(), soundMuted: sound.muted, played: null, snap: true };
  let painted = 0;
  function paint() {
    renderer.draw(game, staged.screen, ui);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const game = createGame(seed);
  const ui = {
    hoverCard: -1,
    time: 0,
    best: readBest(),
    soundMuted: sound.muted,
    played: null,
  };
  let screen = SCREEN.TITLE;
  let last = performance.now();

  function announce(text) {
    status.textContent = text;
  }

  function consumeFx() {
    for (const fx of game.fx) {
      if (fx.kind === 'played') {
        ui.played = { card: fx.card, by: fx.by, age: 0 };
        sound.play();
      } else if (fx.kind === 'hit') {
        sound.hit();
        const target = fx.by === 'player' ? { x: 340, y: 66 } : { x: 340, y: 636 };
        if (fx.amount > 0) game.floaters.push({ x: target.x, y: target.y, text: `-${fx.amount}`, color: '#ff6b4a', age: 0 });
        if (fx.blocked > 0) game.floaters.push({ x: target.x, y: target.y - 30, text: `blocked ${fx.blocked}`, color: '#4fc3ff', age: 0 });
      } else if (fx.kind === 'block') {
        sound.block();
      } else if (fx.kind === 'surge') {
        sound.play();
      } else if (fx.kind === 'combo') {
        sound.combo();
      } else if (fx.kind === 'win') {
        sound.win();
        if (game.score > ui.best) {
          ui.best = game.score;
          saveBest(game.score);
        }
        screen = SCREEN.OVER;
        announce(`Victory! Score ${game.score}.`);
      } else if (fx.kind === 'lose') {
        sound.lose();
        screen = SCREEN.OVER;
        announce(`Defeat. Score ${game.score}.`);
      }
    }
    game.fx.length = 0;
  }

  function endTurn() {
    if (game.phase !== PHASE.PLAY || screen !== SCREEN.PLAY) return;
    sound.deal();
    foeAct(game, chooseIntent);
    consumeFx();
    if (game.phase === PHASE.PLAY) {
      announce(`Turn ${game.turn}. Energy ${game.player.energy}. Foe ${game.intent.label}.`);
    }
  }

  function playCardAt(index) {
    if (game.phase !== PHASE.PLAY || screen !== SCREEN.PLAY) return;
    const before = game.player.hand[index];
    if (before === undefined) return;
    if (playPlayerCard(game, index)) {
      consumeFx();
      if (game.phase === PHASE.PLAY) {
        announce(`Played a card. Energy ${game.player.energy}.`);
      }
    }
  }

  function startNewDuel() {
    startDuel(game, chooseIntent);
    consumeFx();
    screen = SCREEN.PLAY;
    announce(`Turn 1. Energy ${game.player.energy}. Foe ${game.intent.label}.`);
  }

  createInput(canvas, (action) => {
    if (action.type === 'hover') {
      if (screen === SCREEN.PLAY) {
        const hit = hitTest(game, screen, action.x, action.y);
        ui.hoverCard = hit && hit.kind === 'card' ? hit.index : -1;
      } else {
        ui.hoverCard = -1;
      }
      return;
    }
    if (action.type === 'click') {
      const hit = hitTest(game, screen, action.x, action.y);
      if (!hit) return;
      sound.click();
      if (hit.kind === 'play' && screen === SCREEN.TITLE) startNewDuel();
      else if (hit.kind === 'card') playCardAt(hit.index);
      else if (hit.kind === 'endturn') endTurn();
      else if (hit.kind === 'restart' && screen === SCREEN.OVER) startNewDuel();
      return;
    }
    if (action.type === 'key') {
      const key = action.key;
      if (key === 'm' || key === 'M') {
        ui.soundMuted = sound.toggleMute();
        return;
      }
      if (key === 'Escape') {
        if (screen === SCREEN.PAUSED) screen = SCREEN.PLAY;
        else if (screen === SCREEN.PLAY) screen = SCREEN.PAUSED;
        else if (screen === SCREEN.OVER) screen = SCREEN.TITLE;
        return;
      }
      if (key === 'p' || key === 'P') {
        if (screen === SCREEN.PLAY) screen = SCREEN.PAUSED;
        else if (screen === SCREEN.PAUSED) screen = SCREEN.PLAY;
        return;
      }
      if (screen === SCREEN.TITLE && (key === 'Enter' || key === ' ')) {
        startNewDuel();
        return;
      }
      if (screen === SCREEN.OVER && (key === 'Enter' || key === ' ')) {
        startNewDuel();
        return;
      }
      if (screen !== SCREEN.PLAY) return;
      if (key === ' ' || key === 'Enter') {
        endTurn();
        return;
      }
      const n = Number.parseInt(key, 10);
      if (Number.isInteger(n) && n >= 1 && n <= 7) playCardAt(n - 1);
    }
  });

  function frame(now) {
    const dt = Math.min(100, now - last);
    last = now;
    ui.time += dt;
    if (ui.played) {
      ui.played.age += dt;
      if (ui.played.age > 900) ui.played = null;
    }
    for (const f of game.floaters) f.age += dt;
    game.floaters = game.floaters.filter((f) => f.age < 900);
    renderer.draw(game, screen, ui);
    requestAnimationFrame(frame);
  }
  announce('Ember Sigils. Press Enter or click Play to begin.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
