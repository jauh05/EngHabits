import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';
import { useState } from 'react';
import { useSettings } from '../../lib/settings';
import { speak, ttsSupported } from '../../lib/tts';

/** Tombol 🔊 dengan gelombang suara yang bergerak selama audio diputar. */
export function SpeakButton({ text, label, className = '' }: { text: string; label: string; className?: string }) {
  const { settings } = useSettings();
  const [playing, setPlaying] = useState(false);
  const supported = ttsSupported();

  return (
    <button
      type="button"
      aria-label={label}
      title={supported ? label : 'Browser ini tidak mendukung suara'}
      disabled={!supported}
      onClick={() =>
        speak(text, {
          accent: settings.accent,
          rate: settings.rate,
          onStart: () => setPlaying(true),
          onEnd: () => setPlaying(false),
        })
      }
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full bg-primary-100 px-3 text-primary-700 outline-none transition-colors hover:bg-primary-300/40 focus-visible:outline-2 focus-visible:outline-primary-500 disabled:opacity-50 ${className}`}
    >
      <Volume2 size={18} aria-hidden="true" />
      <span aria-hidden="true" className="flex h-4 items-end gap-0.5">
        {[0, 1, 2].map((bar) => (
          <motion.span
            key={bar}
            className="block h-full w-0.5 origin-bottom rounded-full bg-current"
            animate={playing ? { scaleY: [0.3, 1, 0.5, 1] } : { scaleY: 0.5 }}
            transition={playing ? { duration: 0.8, repeat: Infinity, delay: bar * 0.12, ease: 'easeInOut' } : { duration: 0.2 }}
          />
        ))}
      </span>
    </button>
  );
}
