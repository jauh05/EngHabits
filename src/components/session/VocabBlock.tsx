import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import type { DayView } from '../../lib/content';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { FlipCard } from '../ui/FlipCard';
import { SpeakButton } from './SpeakButton';

type Vocab = DayView['block1']['vocab'][number];

function VocabRow({ item }: { item: Vocab }) {
  return (
    <tr className="border-t border-line align-top">
      <td className="px-3 py-3 text-sm tabular-nums text-muted">{item.no}</td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-ink">{item.en}</span>
          <SpeakButton text={item.en} label={`Dengarkan kata ${item.en}`} className="min-h-9 min-w-9 px-2" />
        </div>
      </td>
      <td className="px-3 py-3 text-sm text-muted">{item.pronunciationId}</td>
      <td className="px-3 py-3">
        <Badge tone="lavender">{item.pos}</Badge>
      </td>
      <td className="px-3 py-3 text-sm text-ink">{item.meaningId}</td>
      <td className="px-3 py-3 text-sm">
        <div className="flex items-start gap-2">
          <span>
            <span className="block text-ink">{item.example}</span>
            <span className="block text-muted">{item.exampleId}</span>
          </span>
          <SpeakButton text={item.example} label={`Dengarkan contoh ${item.en}`} className="min-h-9 min-w-9 px-2" />
        </div>
      </td>
    </tr>
  );
}

function VocabCard({ item }: { item: Vocab }) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-lg font-bold text-ink">
          <span className="mr-2 text-sm font-semibold text-muted">{item.no}.</span>
          {item.en}
        </p>
        <SpeakButton text={item.en} label={`Dengarkan kata ${item.en}`} />
      </div>
      <p className="text-sm text-muted">
        Cara baca: <span className="font-semibold text-ink">{item.pronunciationId}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="lavender">{item.pos}</Badge>
        <span className="font-semibold text-ink">{item.meaningId}</span>
      </div>
      <div className="mt-1 flex items-start justify-between gap-2 rounded-2xl bg-bg p-3">
        <span>
          <span className="block text-sm text-ink">{item.example}</span>
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
      <section aria-labelledby="vocab-table" className="flex flex-col gap-3">
        <h2 id="vocab-table" className="text-lg font-bold text-ink">
          10 kosakata hari ini
        </h2>
        <div className="hidden overflow-x-auto rounded-card border border-line bg-surface shadow-card md:block">
          <table className="w-full min-w-[640px] text-left">
            <caption className="sr-only">Daftar kosakata hari ini</caption>
            <thead className="bg-primary-100 text-sm text-primary-700">
              <tr>
                <th scope="col" className="px-3 py-3">No</th>
                <th scope="col" className="px-3 py-3">Kata</th>
                <th scope="col" className="px-3 py-3">Cara baca</th>
                <th scope="col" className="px-3 py-3">Kelas</th>
                <th scope="col" className="px-3 py-3">Arti</th>
                <th scope="col" className="px-3 py-3">Contoh & terjemahan</th>
              </tr>
            </thead>
            <tbody>
              {block.vocab.map((item) => (
                <VocabRow key={item.no} item={item} />
              ))}
            </tbody>
          </table>
        </div>
        <ul className="flex flex-col gap-3 md:hidden">
          {block.vocab.map((item) => (
            <li key={item.no}>
              <VocabCard item={item} />
            </li>
          ))}
        </ul>
      </section>

      <Card tone="lavender" className="flex gap-3">
        <Lightbulb size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-primary-700" />
        <p className="text-sm text-ink">
          <span className="font-bold">Tips mengingat: </span>
          {block.tip}
        </p>
      </Card>

      <section aria-labelledby="flash-title" className="flex flex-col gap-3">
        <h2 id="flash-title" className="text-lg font-bold text-ink">
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
