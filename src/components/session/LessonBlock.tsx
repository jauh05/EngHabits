import { ExternalLink, Eye, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getNote, saveNote } from '../../lib/db';
import type { DayView } from '../../lib/content';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Inline } from './Inline';
import { SpeakButton } from './SpeakButton';

type Youtube = {
  keywords: string[];
  channels: string[];
  watchFor: string[];
  videoDescription?: string;
};

/** Panel video pendukung. Judul video bisa berubah, jadi yang dicari adalah kata kuncinya. */
export function YoutubePanel({ youtube, title }: { youtube: Youtube; title: string }) {
  const query = encodeURIComponent(youtube.keywords.join(' '));
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold text-ink">{title}</h3>
        {youtube.videoDescription && <p className="text-sm text-muted">{youtube.videoDescription}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {youtube.keywords.map((keyword) => (
          <Badge key={keyword} tone="lavender">
            {keyword}
          </Badge>
        ))}
      </div>
      <p className="text-sm text-muted">
        Channel yang bisa dicari: <span className="font-semibold text-ink">{youtube.channels.join(', ')}</span>
      </p>
      <div>
        <p className="mb-2 text-sm font-bold text-ink">Perhatikan saat menonton:</p>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-ink">
          {youtube.watchFor.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>
      <a
        href={`https://www.youtube.com/results?search_query=${query}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-primary-100 px-4 font-semibold text-primary-700 outline-none focus-visible:outline-2 focus-visible:outline-primary-500"
      >
        <ExternalLink size={18} aria-hidden="true" />
        Cari di YouTube
      </a>
      <p className="text-xs text-muted">Judul video di YouTube bisa berubah. Cari dengan kata kunci di atas.</p>
    </Card>
  );
}

function NoteBox({ day }: { day: number }) {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    let active = true;
    getNote(day)
      .then((note) => {
        if (active) setText(note);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [day]);

  const persist = () => {
    saveNote(day, text)
      .then(() => setSaved(true))
      .catch(() => setSaved(false));
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="video-note" className="text-sm font-bold text-ink">
        Catatan: tulis 3 contoh kalimat dari video
      </label>
      <textarea
        id="video-note"
        rows={4}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setSaved(false);
        }}
        onBlur={persist}
        placeholder="Contoh: She is my teacher."
        className="w-full rounded-2xl border border-line bg-surface p-3 text-base text-ink outline-none placeholder:text-muted focus:border-primary-500"
      />
      <p className="flex items-center gap-1 text-xs text-muted">
        <Save size={12} aria-hidden="true" />
        {saved ? 'Tersimpan di perangkat ini' : 'Belum tersimpan. Keluar dari kolom untuk menyimpan.'}
      </p>
    </div>
  );
}

function ExampleList({ items }: { items: Array<{ en: string; id: string }> }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.en} className="flex items-start justify-between gap-2 rounded-2xl bg-bg p-3">
          <span>
            <span className="block font-semibold text-ink">{item.en}</span>
            <span className="block text-sm text-muted">{item.id}</span>
          </span>
          <SpeakButton text={item.en} label={`Dengarkan: ${item.en}`} />
        </li>
      ))}
    </ul>
  );
}

export function LessonBlock({ day, block }: { day: number; block: DayView['block2'] }) {
  const { lesson, youtube } = block;

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="video-title" className="flex flex-col gap-3">
        <p className="text-sm font-bold uppercase tracking-wide text-primary-700">2A · Video pendukung (15 menit)</p>
        <YoutubePanel youtube={youtube} title="Tonton satu video, lalu tulis contohnya" />
        <NoteBox day={day} />
      </section>

      <section aria-labelledby="lesson-title" className="flex flex-col gap-4">
        <p className="text-sm font-bold uppercase tracking-wide text-primary-700">2B · Penjelasan mentor (20 menit)</p>
        <Card tone="lavender">
          <h3 id="lesson-title" className="sr-only">
            Penjelasan materi
          </h3>
          <p className="text-base leading-relaxed text-ink">{lesson.intro}</p>
        </Card>

        {lesson.sections.map((section) => (
          <Card key={section.heading} className="flex flex-col gap-2">
            <h4 className="text-lg font-bold text-ink">{section.heading}</h4>
            <p className="leading-relaxed text-ink">
              <Inline text={section.bodyMd} />
            </p>
          </Card>
        ))}

        <Card className="flex flex-col gap-3">
          <h4 className="text-lg font-bold text-ink">Pola</h4>
          <ul className="flex flex-col gap-2">
            {lesson.formulas.map((formula) => (
              <li key={formula.label} className="flex flex-col gap-0.5 rounded-2xl border border-line p-3">
                <span className="text-xs font-bold uppercase text-muted">{formula.label}</span>
                <code className="font-mono text-sm text-primary-700">{formula.pattern}</code>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="flex flex-col gap-5">
          <h4 className="flex items-center gap-2 text-lg font-bold text-ink">
            <Eye size={20} aria-hidden="true" />
            Contoh
          </h4>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold text-ink">Positif</p>
            <ExampleList items={lesson.examples.positive} />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold text-muted">Negatif</p>
            <ExampleList items={lesson.examples.negative} />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold text-primary-700">Tanya</p>
            <ExampleList items={lesson.examples.question} />
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <h4 className="text-lg font-bold text-ink">Kesalahan umum</h4>
          <ul className="flex flex-col gap-3">
            {lesson.commonMistakes.map((mistake) => (
              <li key={mistake.wrong} className="flex flex-col gap-1 rounded-2xl border border-line p-3">
                <p className="text-sm text-ink">
                  ❌ <span className="line-through">{mistake.wrong}</span>
                </p>
                <p className="text-sm font-semibold text-ink">✅ {mistake.right}</p>
                <p className="text-sm text-muted">{mistake.whyId}</p>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
