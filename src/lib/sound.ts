// Tiny sound effects for the games, synthesised with the Web Audio API — no
// files to load. Gentle, warm tones, never harsh. A single on/off flag (wired
// to the Sound setting) silences everything. All calls are safe to make even
// where audio is unavailable; they just do nothing.

let enabled = true;
export function setSoundEnabled(on: boolean) {
  enabled = on;
}

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (!enabled) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

// One soft, bell-like note.
function note(freq: number, start: number, dur: number, gain = 0.14) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  const t0 = ac.currentTime + start;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

// A single bright, pleasant ping — a right answer.
export function ding() {
  note(880, 0, 0.18);
  note(1318.5, 0.04, 0.2);
}

// A gentle, low "not quite" — never a harsh buzzer.
export function nope() {
  note(300, 0, 0.18, 0.1);
  note(240, 0.08, 0.22, 0.1);
}

// A little rising fanfare — a puzzle solved, a game won.
export function win() {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
  notes.forEach((f, i) => note(f, i * 0.1, 0.35, 0.13));
}

// A soft tick for a move or selection (used sparingly).
export function tick() {
  note(660, 0, 0.06, 0.06);
}
