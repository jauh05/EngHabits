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
  const voice = pickVoice(options.accent);
  if (voice) utterance.voice = voice;
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
