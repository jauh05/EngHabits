export type Accent = 'en-US' | 'en-GB';

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/** Voice bahasa Inggris untuk aksen yang dipilih. Jika tidak ada, pakai voice Inggris apa pun. */
export function pickVoice(accent: Accent): SpeechSynthesisVoice | undefined {
  return englishVoices(accent)[0];
}

export function hasEnglishVoice(): boolean {
  return pickVoice('en-US') !== undefined || pickVoice('en-GB') !== undefined;
}

export type SpeakOptions = {
  accent: Accent;
  rate: number;
  /** Suara khusus untuk pembicara ini. Bila kosong, pakai voice default untuk aksen. */
  voice?: SpeechSynthesisVoice;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
};

// Peramban di Android dan iOS kadang membuang utterance yang tidak punya referensi, sehingga suara berhenti
// atau onend tidak terpanggil. Referensi disimpan di sini sampai suara selesai.
let activeUtterance: SpeechSynthesisUtterance | null = null;

// Nomor percakapan yang sedang diputar. Suara lain yang dimulai menaikkan nomor ini, sehingga sisa baris
// percakapan lama tidak ikut diputar.
let dialogRun = 0;

/** Memberi tahu saat daftar voice berubah. Di Android dan iOS daftar voice sering kosong saat halaman baru dibuka. */
export function subscribeVoices(listener: () => void): () => void {
  if (!ttsSupported()) return () => undefined;
  const synth = window.speechSynthesis;
  synth.addEventListener('voiceschanged', listener);
  // Membaca daftar voice sekali membantu peramban memuatnya lebih cepat.
  synth.getVoices();
  return () => synth.removeEventListener('voiceschanged', listener);
}

/** Bacakan teks. Memotong suara yang sedang berjalan agar tidak bertumpuk. */
export function speak(text: string, options: SpeakOptions): void {
  dialogRun += 1;
  speakUtterance(text, options);
}

function speakUtterance(text: string, options: SpeakOptions): void {
  if (!ttsSupported()) {
    options.onEnd?.();
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  // Chrome di Android kadang tetap pause setelah cancel. Resume memastikan suara baru bisa berbunyi.
  synth.resume();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate;
  const voice = options.voice ?? pickVoice(options.accent);
  // Bahasa mengikuti voice yang dipilih. Bila berbeda, Chrome di Android kembali ke voice bawaan,
  // sehingga semua pembicara terdengar sama.
  utterance.lang = voice ? voice.lang.replace('_', '-') : options.accent;
  if (voice) utterance.voice = voice;
  if (options.pitch !== undefined) utterance.pitch = options.pitch;
  const finish = () => {
    if (activeUtterance === utterance) activeUtterance = null;
    options.onEnd?.();
  };
  utterance.onstart = () => options.onStart?.();
  utterance.onend = finish;
  utterance.onerror = finish;
  activeUtterance = utterance;
  synth.speak(utterance);
}

export function stopSpeaking(): void {
  dialogRun += 1;
  if (ttsSupported()) window.speechSynthesis.cancel();
}

// Voice efek di macOS dan iOS. Suaranya seperti robot atau bernyanyi, jadi tidak cocok untuk latihan mendengar.
const NOVELTY_VOICES = new Set([
  'Albert',
  'Bad News',
  'Bahh',
  'Bells',
  'Boing',
  'Bubbles',
  'Cellos',
  'Deranged',
  'Good News',
  'Hysterical',
  'Jester',
  'Organ',
  'Pipe Organ',
  'Superstar',
  'Trinoids',
  'Whisper',
  'Wobble',
  'Zarvox',
]);

/** Semua voice bahasa Inggris di perangkat, tanpa voice efek. Voice untuk aksen yang dipilih diletakkan di depan. */
export function englishVoices(accent: Accent): SpeechSynthesisVoice[] {
  if (!ttsSupported()) return [];
  const english = window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.startsWith('en') && !NOVELTY_VOICES.has(voice.name));
  return [...english.filter((voice) => voice.lang === accent), ...english.filter((voice) => voice.lang !== accent)];
}

// Nada per pembicara. Pembicara pertama memakai nada normal, pembicara kedua lebih rendah, dan seterusnya.
const SPEAKER_PITCHES = [1, 0.75, 1.3, 0.9];

/**
 * Suara untuk satu pembicara dalam percakapan. Setiap pembicara dapat voice berbeda bila perangkat punya lebih
 * dari satu voice Inggris. Nada juga selalu dibedakan, karena sebagian peramban mengabaikan pilihan voice.
 */
export function speakerVoice(
  speaker: string,
  speakers: string[],
  accent: Accent,
): { voice?: SpeechSynthesisVoice; pitch: number } {
  const index = Math.max(0, speakers.indexOf(speaker));
  const voices = englishVoices(accent);
  const voice = voices.length > 0 ? voices[index % voices.length] : undefined;
  return { voice, pitch: SPEAKER_PITCHES[index % SPEAKER_PITCHES.length] };
}

export type DialogLine = { speaker: string; text: string };

// Label pembicara di awal naskah atau setelah akhir kalimat, misalnya "A: ", "B: ", atau "Staff: ".
const SPEAKER_LABEL = /(^|[.!?"'”]\s+)([A-Z][A-Za-z]*(?: [A-Z][a-z]+)?):\s+/g;

/** Memecah naskah "A: ... B: ..." menjadi baris per pembicara. Naskah tanpa label menjadi satu baris. */
export function splitDialog(script: string): DialogLine[] {
  const matches = [...script.matchAll(SPEAKER_LABEL)];
  if (matches.length < 2 || matches[0].index !== 0) return [{ speaker: '', text: script.trim() }];
  return matches.map((match, at) => {
    const start = match.index + match[0].length;
    const next = matches[at + 1];
    // Tanda baca akhir kalimat sebelum label berikutnya tetap milik baris ini.
    const end = next ? next.index + 1 : script.length;
    return { speaker: match[2], text: script.slice(start, end).trim() };
  });
}

/** Membacakan baris percakapan berurutan, dengan suara berbeda untuk setiap pembicara. */
export function speakDialog(
  lines: DialogLine[],
  options: { accent: Accent; rate: number; onLine?: (index: number) => void; onEnd?: () => void },
): void {
  const run = ++dialogRun;
  const speakers = [...new Set(lines.map((line) => line.speaker))];
  const play = (index: number) => {
    if (run !== dialogRun || index >= lines.length) {
      options.onEnd?.();
      return;
    }
    const variant = speakerVoice(lines[index].speaker, speakers, options.accent);
    speakUtterance(lines[index].text, {
      accent: options.accent,
      rate: options.rate,
      voice: variant.voice,
      pitch: variant.pitch,
      onStart: () => options.onLine?.(index),
      onEnd: () => play(index + 1),
    });
  };
  play(0);
}
