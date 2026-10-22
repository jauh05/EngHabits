import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import type { DayView } from '../../lib/content';
import { Button } from '../ui/Button';
import { Card, type CardTone } from '../ui/Card';
import { FlipCard } from '../ui/FlipCard';
import { SpeakButton } from './SpeakButton';

type Vocab = DayView['block1']['vocab'][number];

/** Warna kartu kosakata bergilir, supaya tiap kata punya warna sendiri seperti kartu di referensi. */
const TONES: CardTone[] = ['sun', 'orange', 'sky', 'periwinkle', 'rose', 'mint'];

function VocabCard({ item, tone }: { item: Vocab; tone: CardTone }) {
  return (
    <Card tone={tone} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="grid size-9 place-items-center rounded-full bg-surface text-sm font-extrabold text-ink" aria-hidden="true">
          {item.no}
        </span>
        <SpeakButton text={item.en} label={`Dengarkan kata ${item.en}`} />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-2xl font-extrabold leading-tight text-ink">{item.en}</p>
        <p className="text-xs font-semibold text-ink/70">Cara baca: {item.pronunciationId}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-ink">{item.pos}</span>
        <span className="font-bold text-ink">{item.meaningId}</span>
      </div>
      <div className="flex items-start justify-between gap-2 rounded-2xl bg-surface/85 p-3">
        <span>
          <span className="block text-sm font-semibold text-ink">{item.example}</span>
          <span className="block text-sm text-muted">{item.exampleId}</span>
        </span>
        <SpeakButton text={item.example} label={`Dengarkan contoh ${item.en}`} />
      </div>
    </Card>
  );
}

export function VocabBlock({ block }: { block: DayView['block1'] }) {
  const [card, setCard] = useState(0);
  const flash = block.vocab[card];

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="vocab-list" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="vocab-list" className="text-xl font-extrabold text-ink">
            Kosakata hari ini
          </h2>
          <span className="rounded-full bg-btn-bg px-3 py-1 text-xs font-extrabold text-btn-fg">{block.vocab.length} kata</span>
        </div>
        <ul className="grid gap-4 md:grid-cols-2">
          {block.vocab.map((item, index) => (
            <li key={item.no}>
              <VocabCard item={item} tone={TONES[index % TONES.length]} />
            </li>
          ))}
        </ul>
      </section>

      <Card tone="sun" className="flex gap-3">
        <Lightbulb size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-ink" />
        <p className="text-sm text-ink">
          <span className="font-bold">Tips mengingat: </span>
          {block.tip}
        </p>
      </Card>

      <section aria-labelledby="flash-title" className="flex flex-col gap-3">
        <h2 id="flash-title" className="text-xl font-extrabold text-ink">
          Mini-flashcard
        </h2>
        <FlipCard
          key={flash.no}
          front={<span className="text-3xl font-extrabold text-ink">{flash.en}</span>}
          back={
            <span className="flex flex-col gap-2">
              <span className="text-2xl font-bold text-primary-700">{flash.meaningId}</span>
              <span className="text-sm text-ink">{flash.pronunciationId}</span>
            </span>
          }
        />
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            size="md"
            aria-label="Kartu sebelumnya"
            disabled={card === 0}
            onClick={() => setCard((value) => Math.max(0, value - 1))}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </Button>
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-semibold text-muted">
              Kartu {card + 1} dari {block.vocab.length}
            </span>
            <SpeakButton text={flash.en} label={`Dengarkan kata ${flash.en}`} />
          </div>
          <Button
            variant="secondary"
            size="md"
            aria-label="Kartu berikutnya"
            disabled={card === block.vocab.length - 1}
            onClick={() => setCard((value) => Math.min(block.vocab.length - 1, value + 1))}
          >
            <ChevronRight size={18} aria-hidden="true" />
          </Button>
        </div>
      </section>
    </div>
  );
}
