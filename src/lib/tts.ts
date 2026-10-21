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

/** Bacakan teks. Memotong suara yang sedang berjalan agar tidak bertumpuk. */
export function speak(text: string, options: SpeakOptions): void {
  if (!ttsSupported()) {
    options.onEnd?.();
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.accent;
  utterance.rate = options.rate;
  const voice = pickVoice(options.accent);
  if (voice) utterance.voice = voice;
  utterance.onstart = () => options.onStart?.();
  utterance.onend = () => options.onEnd?.();
  utterance.onerror = () => options.onEnd?.();
  synth.speak(utterance);
}

export function stopSpeaking(): void {
  if (ttsSupported()) window.speechSynthesis.cancel();
}
