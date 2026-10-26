import { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Play } from 'lucide-react';
import { easeOut } from '../../lib/motion';
import type { BlockView } from '../../lib/content';
import type { Answers } from '../../lib/grading';
import { useSettings } from '../../lib/settings';
import { speak, speakerVoice, ttsSupported } from '../../lib/tts';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { QuestionCard } from './QuestionList';
import { YoutubePanel } from './LessonBlock';
import { SpeakButton } from './SpeakButton';

type Props = {
  block: BlockView;
  answers: Answers;
  onAnswer: (id: string, optionId: string) => void;
};

function ReadingPart({ block }: { block: Extract<BlockView, { type: 'reading' }> }) {
  const [picked, setPicked] = useState<string>();
  const glossary = new Map(block.glossary.map((entry) => [entry.en.toLowerCase(), entry]));
  const entry = picked ? glossary.get(picked) : undefined;

  return (
    <Card className="flex flex-col gap-4">
      <h3 className="text-xl font-bold text-ink">{block.title}</h3>
      <p className="text-sm text-muted">Ketuk kata yang bergaris putus-putus untuk melihat artinya.</p>
      <p className="text-base leading-loose text-ink">
        {block.text.split(/(\s+)/).map((token, index) => {
          const bare = token.toLowerCase().replace(/[^a-z']/g, '');
          if (bare && glossary.has(bare)) {
            return (
              <button
                key={index}
                type="button"
                onClick={() => setPicked(bare)}
                aria-pressed={picked === bare}
                className={`cursor-pointer rounded-md underline decoration-dotted decoration-primary-500 underline-offset-4 outline-none focus-visible:outline-2 focus-visible:outline-primary-500 ${
                  picked === bare ? 'bg-primary-100 text-primary-700' : ''
                }`}
              >
                {token}
              </button>
            );
          }
          return <span key={index}>{token}</span>;
        })}
      </p>
      {entry && (
        <div className="rounded-2xl bg-primary-100 p-4">
          <p className="font-bold text-primary-700">{entry.en}</p>
          <p className="text-sm text-ink">{entry.id}</p>
        </div>
      )}
    </Card>
  );
}

function ListeningPart({ block }: { block: Extract<BlockView, { type: 'listening' }> }) {
  const { settings } = useSettings();
  const [showText, setShowText] = useState(false);
  const [current, setCurrent] = useState<number>();
  const [playingAll, setPlayingAll] = useState(false);

  const playFrom = (index: number) => {
    const lines = block.script.lines;
    if (index >= lines.length) {
      setCurrent(undefined);
      setPlayingAll(false);
      return;
    }
    setPlayingAll(true);
    const speakers = [...new Set(lines.map((line) => line.speaker))];
    const variant = speakerVoice(lines[index].speaker, speakers, settings.accent);
    speak(lines[index].text, {
      accent: settings.accent,
      rate: settings.rate,
      voice: variant.voice,
      pitch: variant.pitch,
      onStart: () => setCurrent(index),
      onEnd: () => playFrom(index + 1),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card tone="sky" className="flex flex-col gap-4">
        <h3 className="text-xl font-bold text-ink">{block.script.title}</h3>
        <p className="text-sm text-ink/80">
          Langkah 1: dengarkan tanpa teks. Langkah 2: tampilkan teks dan ulangi per baris (shadowing).
        </p>
        {/* Pemutar seperti referensi: tombol putar, baris yang sedang dibacakan, dan bilah kemajuan. */}
        <div className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              aria-label="Putar semua baris"
              disabled={!ttsSupported() || playingAll}
              onClick={() => playFrom(0)}
            >
              <Play size={18} aria-hidden="true" />
            </Button>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-bold text-ink">
                {current === undefined ? 'Siap diputar' : block.script.lines[current].speaker}
              </span>
              <span className="text-xs font-semibold tabular-nums text-muted">
                {current === undefined
                  ? `${block.script.lines.length} baris`
                  : `Baris ${current + 1} dari ${block.script.lines.length}`}
              </span>
            </div>
          </div>
          <div
            role="progressbar"
            aria-label="Kemajuan audio"
            aria-valuemin={0}
            aria-valuemax={block.script.lines.length}
            aria-valuenow={(current ?? -1) + 1}
            className="h-2 overflow-hidden rounded-full bg-track"
          >
            <motion.div
              className="h-full rounded-full bg-primary-500"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: ((current ?? -1) + 1) / block.script.lines.length }}
              transition={{ duration: 0.3, ease: easeOut }}
              style={{ width: '100%', transformOrigin: 'left' }}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={!ttsSupported() || playingAll}
            onClick={() => playFrom(0)}
          >
            <Play size={18} aria-hidden="true" />
            Dengarkan semua
          </Button>
          <Button variant="ghost" onClick={() => setShowText((value) => !value)} aria-pressed={showText}>
            {showText ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            {showText ? 'Sembunyikan teks' : 'Tampilkan teks'}
          </Button>
        </div>
        {showText && (
          <ol className="flex flex-col gap-2">
            {block.script.lines.map((line, index) => (
              <li
                key={index}
                className={`flex items-start justify-between gap-3 rounded-2xl p-3 transition-colors ${
                  current === index ? 'bg-primary-100' : 'bg-bg'
                }`}
              >
                <span>
                  <span className="block text-sm font-bold text-primary-700">{line.speaker}</span>
                  <span className="block text-base text-ink">{line.text}</span>
                </span>
                <SpeakButton text={line.text} label={`Putar baris ${index + 1}`} />
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card className="flex flex-col gap-2">
        <h4 className="font-bold text-ink">Tips shadowing</h4>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-ink">
          {block.shadowingTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </Card>

      <YoutubePanel youtube={block.youtube} title="Rekomendasi video pendengaran" />
    </div>
  );
}

/** Blok 3: membaca (hari ganjil) atau mendengarkan (hari genap), lalu 5 soal. */
export function PracticeBlock({ block, answers, onAnswer }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm font-bold uppercase tracking-wide text-primary-700">
        3 · {block.type === 'reading' ? 'Membaca' : 'Mendengarkan & shadowing'} (30 menit)
      </p>
      {block.type === 'reading' ? <ReadingPart block={block} /> : <ListeningPart block={block} />}

      <section aria-labelledby="practice-questions" className="flex flex-col gap-4">
        <h3 id="practice-questions" className="text-lg font-bold text-ink">
          Soal pemahaman
        </h3>
        {block.questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            selected={answers[question.id]}
            onSelect={(optionId) => onAnswer(question.id, optionId)}
          />
        ))}
      </section>
    </div>
  );
}
