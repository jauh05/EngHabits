import { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { Badge } from '../components/ui/Badge';
import { Button, buttonClass } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Confetti } from '../components/ui/Confetti';
import { ProgressRing } from '../components/ui/ProgressRing';
import { TrophyIllustration, VersusBadge } from '../components/ui/BattleIllustrations';
import { useToast } from '../components/ui/Toast';
import {
  answerBattle,
  getBattle,
  openBattleStream,
  rateBattle,
  remainingMs,
  type BattleSnapshot,
  type PublicItem,
} from '../lib/battle';
import { speak, ttsSupported } from '../lib/tts';
import { useSettings } from '../lib/settings';

/** Ruang battle real-time: soal, timer, reveal, penilaian esai, dan hasil. */
export function BattleRoomPage() {
  const { id = '' } = useParams();
  const { settings } = useSettings();
  const { show } = useToast();
  const token = settings.token;
  const [snap, setSnap] = useState<BattleSnapshot | null>(null);
  const [loadError, setLoadError] = useState<string>();
  const [now, setNow] = useState(() => Date.now());
  const [streamKey, setStreamKey] = useState(0);
  const [offset, setOffset] = useState(0);

  // Selisih jam dihitung saat keadaan diterima, supaya hitung mundur tidak membeku.
  const applySnapshot = (next: BattleSnapshot) => {
    setSnap(next);
    setOffset(next.serverNow - Date.now());
  };

  useEffect(() => {
    if (!token) return;
    getBattle(token, id)
      .then(applySnapshot)
      .catch((caught) => setLoadError(caught instanceof Error ? caught.message : 'Battle tidak bisa dibuka.'));
  }, [token, id, streamKey]);

  useEffect(() => {
    if (!token) return;
    return openBattleStream(
      token,
      (event) => {
        if (event.type === 'battle' && event.battle.id === id) applySnapshot(event.battle);
      },
      () => {
        // Koneksi putus: coba lagi setelah jeda singkat, dan muat ulang keadaan dari server.
        window.setTimeout(() => setStreamKey((key) => key + 1), 2000);
      },
    );
  }, [token, id, streamKey]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  if (loadError) {
    return (
      <div className="flex flex-col gap-4">
        <p role="alert" className="text-ink">{loadError}</p>
        <Link to="/battle" className={buttonClass('secondary', 'md', 'w-fit')}>
          Kembali ke Battle
        </Link>
      </div>
    );
  }
  if (!snap) return <p className="text-muted">Memuat battle…</p>;

  const me = snap.players.find((player) => player?.id === snap.you);
  const opponent = snap.players.find((player) => player && player.id !== snap.you);
  const endedBadge = ['declined', 'expired', 'cancelled'].includes(snap.status);

  return (
    <div className="flex flex-col gap-6">
      <Scoreboard snap={snap} meName={me?.name ?? 'Kamu'} opponentName={opponent?.name ?? 'Lawan'} />

      {snap.status === 'pending' && (
        <Card className="flex flex-col items-center gap-3 py-8 text-center">
          <VersusBadge className="size-16" />
          <p className="font-bold text-ink">Menunggu lawan menerima undangan…</p>
        </Card>
      )}

      {endedBadge && (
        <Card className="flex flex-col gap-3 text-center">
          <p className="font-bold text-ink">Battle ini tidak dilanjutkan.</p>
          <Link to="/battle" className={buttonClass('primary', 'md', 'mx-auto')}>
            Kembali ke Battle
          </Link>
        </Card>
      )}

      {(snap.phase === 'idle' || snap.phase === 'countdown') && snap.status !== 'pending' && (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm font-semibold text-muted">
            Soal {Math.min(snap.round + 2, snap.total)} dari {snap.total}
          </p>
          <p className="text-3xl font-extrabold text-ink">Bersiap…</p>
        </Card>
      )}

      {snap.phase === 'question' && snap.current && (
        <QuestionPanel
          key={snap.current.index}
          snap={snap}
          item={snap.current}
          remaining={remainingMs(snap, now, offset)}
          token={token}
          onError={(message) => show(message, 'error')}
        />
      )}

      {snap.phase === 'reveal' && snap.reveal && (
        <RevealPanel snap={snap} meId={snap.you} opponentId={opponent?.id ?? ''} />
      )}

      {snap.phase === 'rating' && snap.rating && (
        <RatingPanel
          token={token}
          battleId={snap.id}
          criteria={snap.rating.criteria}
          essays={snap.rating.essays}
          onError={(message) => show(message, 'error')}
        />
      )}

      {snap.phase === 'finished' && snap.results && (
        <ResultsPanel snap={snap} meId={snap.you} />
      )}

      <Lives snap={snap} meId={snap.you} opponentId={opponent?.id ?? ''} />
    </div>
  );
}

function Scoreboard({ snap, meName, opponentName }: { snap: BattleSnapshot; meName: string; opponentName: string }) {
  const meId = snap.you;
  const opponentId = snap.players.find((player) => player && player.id !== meId)?.id ?? '';
  const progress = snap.status === 'finished' ? 1 : Math.max(0, snap.round + 1) / snap.total;
  return (
    <Card tone="lime" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink/80">{snap.modeLabel}</p>
          <p className="truncate text-lg font-extrabold text-ink">
            {meName} vs {opponentName}
          </p>
        </div>
        <div className="flex shrink-0 gap-3 text-right">
          <div>
            <p className="text-xs font-semibold text-ink/80">Kamu</p>
            <p className="text-2xl font-extrabold tabular-nums text-ink">{snap.scores[meId] ?? 0}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink/80">Lawan</p>
            <p className="text-2xl font-extrabold tabular-nums text-ink">{snap.scores[opponentId] ?? 0}</p>
          </div>
        </div>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface/70" aria-hidden="true">
        <div className="h-full rounded-full bg-primary-500 transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
      </div>
    </Card>
  );
}

function Lives({ snap, meId, opponentId }: { snap: BattleSnapshot; meId: string; opponentId: string }) {
  if (snap.lives[meId] === null || snap.lives[meId] === undefined) return null;
  return (
    <p className="text-center text-sm font-semibold text-ink">
      Nyawa kamu {snap.lives[meId]} · Nyawa lawan {snap.lives[opponentId] ?? 0}
    </p>
  );
}

function QuestionPanel({
  snap,
  item,
  remaining,
  token,
  onError,
}: {
  snap: BattleSnapshot;
  item: PublicItem;
  remaining: number;
  token: string;
  onError: (message: string) => void;
}) {
  const { settings } = useSettings();
  const [choice, setChoice] = useState<string>();
  const [text, setText] = useState('');
  const [picked, setPicked] = useState<number[]>([]);
  const [sending, setSending] = useState(false);
  const limit = item.seconds * 1000;
  const fraction = Math.min(1, remaining / limit);
  const answered = snap.answered.you;

  const submit = async (value: string) => {
    if (sending || answered) return;
    setSending(true);
    try {
      await answerBattle(token, snap.id, item.index, value);
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : 'Jawaban tidak terkirim.');
    } finally {
      setSending(false);
    }
  };

  const listen = () => {
    if (!item.script) return;
    speak(item.script, { accent: settings.accent, rate: settings.rate });
  };

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <Badge tone="lavender">{typeLabel(item.type)}</Badge>
        <ProgressRing value={fraction} size={72} stroke={8} ariaLabel={`Sisa ${Math.ceil(remaining / 1000)} detik`}>
          <span className="text-lg font-extrabold tabular-nums text-ink">{Math.ceil(remaining / 1000)}</span>
        </ProgressRing>
      </div>

      {item.type === 'story' && item.passage && (
        <p className="rounded-2xl bg-bg p-4 text-base leading-relaxed text-ink">{item.passage}</p>
      )}

      {item.type === 'listen' && (
        <Button variant="secondary" onClick={listen} disabled={!ttsSupported()} className="self-start">
          <Volume2 size={18} aria-hidden="true" />
          Putar lagi
        </Button>
      )}

      <p className="text-lg font-bold leading-snug text-ink">{item.prompt}</p>

      {(item.type === 'mcq' || item.type === 'story' || item.type === 'listen') && item.options && (
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Pilihan jawaban">
          {item.options.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={choice === option.id}
              disabled={answered || sending}
              onClick={() => {
                setChoice(option.id);
                submit(option.id);
              }}
              className={`flex min-h-12 items-center gap-3 rounded-2xl border px-4 text-left font-semibold outline-none focus-visible:outline-2 focus-visible:outline-primary-500 ${
                choice === option.id ? 'border-primary-500 bg-primary-100 text-primary-700' : 'border-line bg-surface text-ink'
              }`}
            >
              <span className="tabular-nums">{option.id}.</span>
              <span>{option.text}</span>
            </button>
          ))}
        </div>
      )}

      {item.type === 'translate' && (
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit(text);
          }}
        >
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={answered}
            rows={3}
            className="rounded-2xl bg-field p-4 text-base text-ink outline-none focus:shadow-[0_0_0_3px_var(--primary-300)]"
            placeholder="Tulis terjemahan dalam bahasa Inggris"
            aria-label="Terjemahan"
          />
          <Button type="submit" disabled={answered || sending || !text.trim()} className="self-end">
            Kirim
          </Button>
        </form>
      )}

      {item.type === 'essay' && (
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit(text);
          }}
        >
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={answered}
            rows={6}
            className="rounded-2xl bg-field p-4 text-base text-ink outline-none focus:shadow-[0_0_0_3px_var(--primary-300)]"
            placeholder="Tulis dalam bahasa Inggris"
            aria-label="Esai"
          />
          <Button type="submit" disabled={answered || sending || !text.trim()} className="self-end">
            Kirim esai
          </Button>
        </form>
      )}

      {item.type === 'reorder' && item.words && (
        <ReorderArea
          words={item.words}
          picked={picked}
          disabled={answered}
          onPick={(index) => setPicked((list) => [...list, index])}
          onUnpick={(position) => setPicked((list) => list.filter((_, at) => at !== position))}
          onSubmit={() => submit(picked.map((index) => item.words?.[index] ?? '').join(' '))}
        />
      )}

      {answered && <p className="text-center text-sm font-semibold text-muted">Jawabanmu terkirim. Menunggu lawan…</p>}
    </Card>
  );
}

function ReorderArea({
  words,
  picked,
  disabled,
  onPick,
  onUnpick,
  onSubmit,
}: {
  words: string[];
  picked: number[];
  disabled: boolean;
  onPick: (index: number) => void;
  onUnpick: (position: number) => void;
  onSubmit: () => void;
}) {
  const used = new Set(picked);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-h-14 flex-wrap gap-2 rounded-2xl bg-bg p-3" aria-label="Susunanmu">
        {picked.length === 0 && <span className="text-sm text-muted">Ketuk kata di bawah sesuai urutannya.</span>}
        {picked.map((index, position) => (
          <button
            key={`${index}-${position}`}
            type="button"
            disabled={disabled}
            onClick={() => onUnpick(position)}
            className="min-h-11 rounded-full bg-primary-100 px-4 font-semibold text-primary-700"
          >
            {words[index]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {words.map((word, index) => (
          <button
            key={index}
            type="button"
            disabled={disabled || used.has(index)}
            onClick={() => onPick(index)}
            className="min-h-11 rounded-full border border-line bg-surface px-4 font-semibold text-ink disabled:opacity-40"
          >
            {word}
          </button>
        ))}
      </div>
      <Button onClick={onSubmit} disabled={disabled || picked.length === 0} className="self-end">
        Kirim
      </Button>
    </div>
  );
}

function RevealPanel({ snap, meId, opponentId }: { snap: BattleSnapshot; meId: string; opponentId: string }) {
  const reveal = snap.reveal!;
  const mine = reveal.results[meId];
  const theirs = reveal.results[opponentId];
  return (
    <Card className="flex flex-col gap-4">
      {reveal.type === 'essay' ? (
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{mine?.answered ? 'Esai terkirim' : 'Tidak menjawab'}</Badge>
          <span className="text-sm text-muted">Esai dinilai sendiri setelah semua soal selesai.</span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={mine?.correct ? 'easy' : 'hard'}>{mine?.correct ? 'Benar' : mine?.answered ? 'Belum tepat' : 'Tidak menjawab'}</Badge>
          <span className="text-sm font-semibold text-ink">+{mine?.points ?? 0} poin</span>
          <span className="text-sm text-muted">Lawan: +{theirs?.points ?? 0}</span>
        </div>
      )}
      {reveal.correct && (
        <p className="text-sm text-ink">
          Jawaban benar: <span className="font-bold">{reveal.correct}</span>
        </p>
      )}
      {reveal.explanation && <p className="text-sm text-muted">{reveal.explanation}</p>}
      {reveal.modelAnswer && (
        <p className="rounded-2xl bg-bg p-4 text-sm text-ink">
          Contoh jawaban: {reveal.modelAnswer}
        </p>
      )}
      <p className="text-center text-sm font-semibold text-muted">Soal berikutnya segera dimulai…</p>
    </Card>
  );
}

function RatingPanel({
  token,
  battleId,
  criteria,
  essays,
  onError,
}: {
  token: string;
  battleId: string;
  criteria: string[];
  essays: Array<{ index: number; answer: string; model: string; rated: boolean }>;
  onError: (message: string) => void;
}) {
  const [scores, setScores] = useState<Record<number, number[]>>({});
  const pending = essays.filter((essay) => !essay.rated);

  const save = async (index: number) => {
    const values = scores[index] ?? criteria.map(() => 0);
    try {
      await rateBattle(token, battleId, index, values);
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : 'Nilai tidak tersimpan.');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-2">
        <h2 className="text-xl font-bold text-ink">Nilai esaimu sendiri</h2>
        <p className="text-sm text-muted">Bandingkan dengan contoh, lalu beri nilai 0 sampai 2 untuk tiap kriteria. Nilai ini ikut skor.</p>
      </Card>
      {pending.length === 0 && <p className="text-center text-sm font-semibold text-muted">Menunggu lawan menilai esainya…</p>}
      {pending.map((essay) => (
        <Card key={essay.index} className="flex flex-col gap-4">
          <p className="text-sm font-semibold text-ink">Jawabanmu:</p>
          <p className="rounded-2xl bg-bg p-4 text-ink">{essay.answer || '(kosong)'}</p>
          <p className="text-sm text-muted">Contoh: {essay.model}</p>
          {criteria.map((criterion, column) => (
            <div key={criterion} className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-ink">{criterion}</span>
              <div className="flex gap-2">
                {[0, 1, 2].map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={(scores[essay.index] ?? [])[column] === value}
                    onClick={() =>
                      setScores((current) => {
                        const row = [...(current[essay.index] ?? criteria.map(() => 0))];
                        row[column] = value;
                        return { ...current, [essay.index]: row };
                      })
                    }
                    className={`size-11 rounded-full font-bold ${
                      (scores[essay.index] ?? [])[column] === value ? 'bg-btn-bg text-btn-fg' : 'bg-primary-100 text-primary-700'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <Button onClick={() => save(essay.index)} className="self-end">
            Simpan nilai
          </Button>
        </Card>
      ))}
    </div>
  );
}

function ResultsPanel({ snap, meId }: { snap: BattleSnapshot; meId: string }) {
  const results = snap.results!;
  const won = results.winnerId === meId;
  const tie = results.winnerId === null;
  const winner = results.players.find((player) => player?.id === results.winnerId);
  return (
    <Card className="relative flex flex-col items-center gap-4 overflow-hidden py-8 text-center">
      {won && <Confetti count={48} />}
      <TrophyIllustration className="size-24" />
      <p className="text-2xl font-extrabold text-ink">{tie ? 'Seri!' : won ? 'Kamu menang!' : `${winner?.name ?? 'Lawan'} menang`}</p>
      <div className="grid w-full grid-cols-2 gap-3">
        {results.players.map((player) => (
          <div key={player?.id} className="rounded-2xl bg-bg p-4">
            <p className="truncate text-sm font-semibold text-muted">{player?.name}</p>
            <p className="text-2xl font-extrabold tabular-nums text-ink">{results.totals[player?.id ?? ''] ?? 0}</p>
          </div>
        ))}
      </div>
      <Link to="/battle" className={buttonClass('primary', 'lg', 'mt-2')}>
        Kembali ke Battle
      </Link>
    </Card>
  );
}

function typeLabel(type: PublicItem['type']): string {
  const labels: Record<PublicItem['type'], string> = {
    mcq: 'Pilihan ganda',
    translate: 'Terjemahan',
    story: 'Cerita',
    essay: 'Esai',
    listen: 'Dengar',
    reorder: 'Susun kalimat',
  };
  return labels[type];
}
