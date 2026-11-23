// Tiny synthesized sound: short oscillator blips, no audio files. Everything is
// generated at run time, so the game needs no network and no assets.
export function createSound() {
  let ctx = null;
  let muted = false;
  try {
    muted = window.localStorage.getItem('ember-sigils-muted') === '1';
  } catch {
    muted = false;
  }

  function ensure() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function tone(freq, dur, type, vol, when = 0) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  return {
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      try {
        window.localStorage.setItem('ember-sigils-muted', muted ? '1' : '0');
      } catch {
        // Storage can be off: the mute then lasts this visit only.
      }
      return muted;
    },
    click() { tone(660, 0.06, 'sine', 0.12); },
    deal() { tone(520, 0.05, 'triangle', 0.1); tone(780, 0.05, 'triangle', 0.08, 0.05); },
    play() { tone(440, 0.08, 'triangle', 0.14); tone(880, 0.07, 'sine', 0.08, 0.06); },
    hit() { tone(180, 0.16, 'sawtooth', 0.16); tone(90, 0.2, 'square', 0.1, 0.02); },
    block() { tone(300, 0.1, 'sine', 0.14); tone(420, 0.1, 'sine', 0.1, 0.05); },
    combo() { tone(523, 0.09, 'triangle', 0.14); tone(659, 0.09, 'triangle', 0.14, 0.08); tone(784, 0.14, 'triangle', 0.14, 0.16); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, i * 0.12)); },
    lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.26, 'sine', 0.12, i * 0.14)); },
  };
}
