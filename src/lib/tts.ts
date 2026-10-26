export type Accent = 'en-US' | 'en-GB';

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/** Voice bahasa Inggris untuk aksen yang dipilih. Jika tidak ada, pakai voice Inggris apa pun. */
export function pickVoice(accent: Accent): SpeechSynthesisVoice | undefined {
  if (!ttsSupported()) return undefined;
  const voices = window.speechSynthesis.getVoices();
  return voices.find((voice) => voice.lang === accent) ?? voices.find((voice) => voice.lang.startsWith('en'));
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
  if (!ttsSupported()) {
    options.onEnd?.();
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  // Chrome di Android kadang tetap pause setelah cancel. Resume memastikan suara baru bisa berbunyi.
  synth.resume();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.accent;
  utterance.rate = options.rate;
  const voice = options.voice ?? pickVoice(options.accent);
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
  if (ttsSupported()) window.speechSynthesis.cancel();
}

/** Semua voice bahasa Inggris di perangkat. Voice untuk aksen yang dipilih diletakkan di depan. */
export function englishVoices(accent: Accent): SpeechSynthesisVoice[] {
  if (!ttsSupported()) return [];
  const english = window.speechSynthesis.getVoices().filter((voice) => voice.lang.startsWith('en'));
  return [...english.filter((voice) => voice.lang === accent), ...english.filter((voice) => voice.lang !== accent)];
}

/**
 * Suara untuk satu pembicara dalam percakapan. Setiap pembicara dapat voice berbeda bila perangkat punya lebih
 * dari satu voice Inggris. Bila hanya ada satu voice, nada dibedakan supaya pembicara tetap terdengar berbeda.
 */
export function speakerVoice(
  speaker: string,
  speakers: string[],
  accent: Accent,
): { voice?: SpeechSynthesisVoice; pitch: number } {
  const index = Math.max(0, speakers.indexOf(speaker));
  const voices = englishVoices(accent);
  const voice = voices.length > 0 ? voices[index % voices.length] : undefined;
  const sameVoice = voices.length <= 1;
  const pitch = sameVoice ? [1, 1.35, 0.8, 1.2][index % 4] : 1;
  return { voice, pitch };
}
