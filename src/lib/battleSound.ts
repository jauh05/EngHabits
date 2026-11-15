/**
 * Musik latar dan bunyi benar/salah untuk ruang battle. Tidak ada berkas audio di repo, jadi semua bunyi dibuat
 * dengan Web Audio API. Browser hanya mengizinkan audio setelah ada interaksi pengguna, sehingga musik yang
 * diminta sebelum itu ditunda sampai pengguna menyentuh layar atau menekan tombol.
 */

type Music = {
  timer: number;
  nextTime: number;
  step: number;
  gain: GainNode;
};

let context: AudioContext | null = null;
let music: Music | null = null;
let wantMusic = false;
let gestureListening = false;

const BPM = 96;
const STEP_SECONDS = 60 / BPM / 2; // satu langkah = seperdelapan nada
const STEPS_PER_BAR = 8;
// Progresi Am - F - C - G, dalam nomor nada MIDI.
const CHORDS = [
  [57, 60, 64],
  [53, 57, 60],
  [48, 52, 55],
  [55, 59, 62],
];

function audioContext(): AudioContext | null {
  if (context) return context;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
    return context;
  } catch {
    return null;
  }
}

function frequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** Satu nada pendek dengan amplop cepat naik lalu turun. */
function tone(ctx: AudioContext, destination: AudioNode, options: { midi: number; start: number; duration: number; peak: number; type: OscillatorType }) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = options.type;
  osc.frequency.setValueAtTime(frequency(options.midi), options.start);
  env.gain.setValueAtTime(0.0001, options.start);
  env.gain.exponentialRampToValueAtTime(options.peak, options.start + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, options.start + options.duration);
  osc.connect(env);
  env.connect(destination);
  osc.start(options.start);
  osc.stop(options.start + options.duration + 0.02);
}

function playStep(ctx: AudioContext, state: Music, step: number, time: number) {
  const chord = CHORDS[Math.floor(step / STEPS_PER_BAR) % CHORDS.length];
  const position = step % STEPS_PER_BAR;
  if (position % 4 === 0) {
    tone(ctx, state.gain, { midi: chord[0] - 12, start: time, duration: STEP_SECONDS * 3.5, peak: 0.07, type: 'triangle' });
  }
  tone(ctx, state.gain, {
    midi: chord[position % chord.length] + 12,
    start: time,
    duration: STEP_SECONDS * 0.9,
    peak: 0.025,
    type: 'sine',
  });
}

function scheduleMusic(ctx: AudioContext) {
  const state = music;
  if (!state) return;
  while (state.nextTime < ctx.currentTime + 0.3) {
    playStep(ctx, state, state.step, state.nextTime);
    state.nextTime += STEP_SECONDS;
    state.step += 1;
  }
}

function startMusicNow(ctx: AudioContext) {
  if (music) return;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(1, ctx.currentTime);
  gain.connect(ctx.destination);
  const state: Music = { timer: 0, nextTime: ctx.currentTime + 0.1, step: 0, gain };
  state.timer = window.setInterval(() => scheduleMusic(ctx), 80);
  music = state;
  scheduleMusic(ctx);
}

function listenForGesture() {
  if (gestureListening) return;
  gestureListening = true;
  const onGesture = () => {
    window.removeEventListener('pointerdown', onGesture);
    window.removeEventListener('keydown', onGesture);
    gestureListening = false;
    const ctx = audioContext();
    if (!ctx) return;
    void ctx.resume().then(() => {
      if (wantMusic) startMusicNow(ctx);
    });
  };
  window.addEventListener('pointerdown', onGesture);
  window.addEventListener('keydown', onGesture);
}

/** Memulai musik latar battle. Aman dipanggil berkali-kali. */
export function startBattleMusic(): void {
  wantMusic = true;
  const ctx = audioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    listenForGesture();
    return;
  }
  startMusicNow(ctx);
}

/** Menghentikan musik latar dengan pudar singkat. */
export function stopBattleMusic(): void {
  wantMusic = false;
  const state = music;
  if (!state || !context) return;
  music = null;
  window.clearInterval(state.timer);
  const now = context.currentTime;
  state.gain.gain.cancelScheduledValues(now);
  state.gain.gain.setValueAtTime(state.gain.gain.value, now);
  state.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
  window.setTimeout(() => state.gain.disconnect(), 400);
}

/** Bunyi jawaban: naik dua nada untuk benar, turun rendah untuk salah atau tidak menjawab. */
export function playAnswerSound(correct: boolean): void {
  const ctx = audioContext();
  if (!ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime + 0.01;
  if (correct) {
    tone(ctx, ctx.destination, { midi: 72, start: now, duration: 0.18, peak: 0.16, type: 'triangle' });
    tone(ctx, ctx.destination, { midi: 76, start: now + 0.12, duration: 0.3, peak: 0.16, type: 'triangle' });
  } else {
    tone(ctx, ctx.destination, { midi: 52, start: now, duration: 0.22, peak: 0.1, type: 'square' });
    tone(ctx, ctx.destination, { midi: 46, start: now + 0.16, duration: 0.32, peak: 0.1, type: 'square' });
  }
}
