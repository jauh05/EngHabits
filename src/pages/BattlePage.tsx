import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Check, Copy, Swords, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { BattleCrest, VersusBadge } from '../components/ui/BattleIllustrations';
import { Badge } from '../components/ui/Badge';
import { Button, buttonClass } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import {
  BATTLE_MODES,
  BATTLE_TOTALS,
  createBattle,
  listBattles,
  openBattleStream,
  respondBattle,
  type BattleMode,
  type BattleSummary,
  type Composition,
  type Invite,
  type QuestionType,
} from '../lib/battle';
import { DEFAULT_COMPOSITION, MIX_TYPES } from '../lib/battleRules';
import { useSettings } from '../lib/settings';

const TYPE_LABEL: Record<QuestionType, string> = {
  mcq: 'Pilihan ganda',
  translate: 'Terjemahan',
  story: 'Cerita',
  essay: 'Esai',
  listen: 'Dengar',
  reorder: 'Susun kalimat',
};

/** Lobi battle: ID saya, undangan masuk, kirim undangan, dan riwayat. */
export function BattlePage() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { show } = useToast();
  const token = settings.token;
  const myId = settings.account?.publicId ?? '';
  const [invites, setInvites] = useState<Invite[]>([]);
  const [history, setHistory] = useState<BattleSummary[]>([]);
  const [opponentId, setOpponentId] = useState('');
  const [mode, setMode] = useState<BattleMode>('campuran');
  const [total, setTotal] = useState<(typeof BATTLE_TOTALS)[number]>(8);
  const [composition, setComposition] = useState<Composition>(DEFAULT_COMPOSITION[8]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    if (!token) return;
    listBattles(token)
      .then((data) => {
        setHistory(data.battles);
        setInvites(data.invites);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Riwayat tidak bisa dimuat.'));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    return openBattleStream(
      token,
      (event) => {
        setConnected(true);
        if (event.type === 'invites') setInvites(event.invites);
        if (event.type === 'invite') {
          setInvites((list) => [event.invite, ...list.filter((item) => item.battleId !== event.invite.battleId)]);
          show(`${event.invite.from?.name ?? 'Seseorang'} mengundangmu battle.`);
        }
        if (event.type === 'battle' && event.battle.status === 'active') navigate(`/battle/${event.battle.id}`);
        if (event.type === 'battle' && event.battle.status === 'finished') {
          show('Battle selesai. Lihat hasilnya di riwayat.');
        }
      },
      () => setConnected(false),
    );
  }, [token, navigate, show]);

  const changeMode = (next: BattleMode) => {
    setMode(next);
    setComposition(next === 'campuran' ? DEFAULT_COMPOSITION[total] : {});
  };

  const changeTotal = (next: (typeof BATTLE_TOTALS)[number]) => {
    setTotal(next);
    if (mode === 'campuran') setComposition(DEFAULT_COMPOSITION[next]);
  };

  const adjust = (type: QuestionType, delta: number) => {
    setComposition((current) => {
      const value = Math.max(0, (current[type] ?? 0) + delta);
      return { ...current, [type]: value };
    });
  };

  const sum = Object.values(composition).reduce((acc, value) => acc + (value ?? 0), 0);
  const compositionOk = mode !== 'campuran' || sum === total;

  const invite = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !opponentId.trim()) return;
    if (!compositionOk) {
      setError(`Jumlah tipe soal harus tepat ${total}.`);
      return;
    }
    setError(undefined);
    setBusy(true);
    try {
      const result = await createBattle(token, {
        opponentPublicId: opponentId.trim(),
        mode,
        total,
        composition: mode === 'campuran' ? composition : undefined,
      });
      show(`Undangan terkirim. Level battle: hari 1 sampai ${result.poolDay}.`, 'success');
      setOpponentId('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Undangan gagal dikirim.');
    } finally {
      setBusy(false);
    }
  };

  const answer = async (item: Invite, accept: boolean) => {
    if (!token) return;
    try {
      await respondBattle(token, item.battleId, accept);
      setInvites((list) => list.filter((entry) => entry.battleId !== item.battleId));
      if (accept) navigate(`/battle/${item.battleId}`);
    } catch (caught) {
      show(caught instanceof Error ? caught.message : 'Undangan tidak bisa diproses.', 'error');
    }
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(myId);
      show('ID disalin.', 'success');
    } catch {
      show('ID tidak bisa disalin. Catat manual.', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-ink lg:text-4xl">Battle</h1>
        <p className="text-muted">Ajak temanmu adu bahasa Inggris. Soal mengikuti hari terendah di antara kalian berdua.</p>
      </header>

      <Card tone="lime" className="relative overflow-hidden">
        <div className="flex items-center gap-4">
          <BattleCrest className="size-20 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink/80">ID battle kamu</p>
            <p className="truncate text-2xl font-extrabold tracking-wide text-ink">{myId || 'Memuat ID…'}</p>
          </div>
          <Button variant="secondary" size="icon" aria-label="Salin ID" onClick={copyId} disabled={!myId}>
            <Copy size={18} aria-hidden="true" />
          </Button>
        </div>
      </Card>

      {!connected && (
        <p role="status" className="rounded-2xl bg-error/15 px-4 py-3 text-sm font-semibold text-ink">
          Koneksi battle terputus. Muat ulang halaman untuk menerima undangan.
        </p>
      )}

      {invites.length > 0 && (
        <section className="flex flex-col gap-3" aria-label="Undangan masuk">
          <h2 className="text-xl font-bold text-ink">Undangan masuk</h2>
          {invites.map((item) => (
            <Card key={item.battleId} tone="sun" className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-ink">{item.from?.name ?? 'Pemain'} mengajakmu battle</p>
                <p className="text-sm text-ink/80">
                  {item.modeLabel} · {item.total} soal
                </p>
              </div>
              <Button size="md" onClick={() => answer(item, true)}>
                <Check size={18} aria-hidden="true" />
                Terima
              </Button>
              <Button variant="secondary" size="md" onClick={() => answer(item, false)}>
                <X size={18} aria-hidden="true" />
                Tolak
              </Button>
            </Card>
          ))}
        </section>
      )}

      <Card className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-primary-100 text-primary-700">
            <Swords size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-ink">Undang lawan</h2>
            <p className="text-sm text-muted">Masukkan ID lawan, misalnya EH-7K3QPX.</p>
          </div>
        </div>

        <form onSubmit={invite} className="flex flex-col gap-5" noValidate>
          <Input
            label="ID lawan"
            name="lawan"
            autoComplete="off"
            value={opponentId}
            onChange={(event) => setOpponentId(event.target.value)}
            placeholder="EH-XXXXXX"
          />

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-semibold text-ink">Mode</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {BATTLE_MODES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={mode === option.id}
                  onClick={() => changeMode(option.id)}
                  className={`flex min-h-14 flex-col items-start rounded-2xl border px-3 py-2 text-left outline-none focus-visible:outline-2 focus-visible:outline-primary-500 ${
                    mode === option.id ? 'border-primary-500 bg-primary-100 text-primary-700' : 'border-line bg-surface text-ink'
                  }`}
                >
                  <span className="text-sm font-bold">{option.label}</span>
                  <span className="text-xs text-muted">{option.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-semibold text-ink">Jumlah soal</legend>
            <div className="flex flex-wrap gap-2">
              {BATTLE_TOTALS.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={total === value}
                  onClick={() => changeTotal(value)}
                  className={`min-h-11 min-w-16 rounded-full px-4 font-bold outline-none focus-visible:outline-2 focus-visible:outline-primary-500 ${
                    total === value ? 'bg-btn-bg text-btn-fg' : 'bg-primary-100 text-primary-700'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </fieldset>

          {mode === 'campuran' && (
            <fieldset className="flex flex-col gap-3 rounded-2xl bg-bg p-4">
              <legend className="px-1 text-sm font-semibold text-ink">Jenis soal</legend>
              {MIX_TYPES.map((type) => (
                <div key={type} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-ink">{TYPE_LABEL[type]}</span>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="icon" aria-label={`Kurangi ${TYPE_LABEL[type]}`} onClick={() => adjust(type, -1)}>
                      −
                    </Button>
                    <span className="w-8 text-center font-bold tabular-nums text-ink">{composition[type] ?? 0}</span>
                    <Button variant="secondary" size="icon" aria-label={`Tambah ${TYPE_LABEL[type]}`} onClick={() => adjust(type, 1)}>
                      +
                    </Button>
                  </div>
                </div>
              ))}
              <p className={`text-sm font-semibold ${compositionOk ? 'text-success' : 'text-error'}`}>
                {sum} dari {total} soal {compositionOk ? '' : '(harus tepat sama)'}
              </p>
            </fieldset>
          )}

          {error && (
            <p role="alert" className="rounded-2xl bg-error/15 px-4 py-3 text-sm font-semibold text-ink">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={busy || !opponentId.trim()}>
            {busy ? 'Mengirim…' : 'Kirim undangan'}
            <ArrowRight size={20} aria-hidden="true" />
          </Button>
        </form>
      </Card>

      <section className="flex flex-col gap-3" aria-label="Riwayat battle">
        <h2 className="text-xl font-bold text-ink">Riwayat</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted">Belum ada battle. Kirim undangan pertamamu di atas.</p>
        ) : (
          history.map((item) => (
            <Card key={item.id} className="flex items-center gap-3">
              <VersusBadge className="size-12 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink">
                  {item.opponent?.name ?? 'Lawan'} · {item.modeLabel}
                </p>
                <p className="text-sm text-muted">{item.total} soal</p>
              </div>
              {item.status === 'finished' ? (
                <Badge tone={item.winner === 'you' ? 'easy' : item.winner === 'opponent' ? 'hard' : 'neutral'}>
                  {item.winner === 'you' ? 'Menang' : item.winner === 'opponent' ? 'Kalah' : 'Seri'}
                </Badge>
              ) : (
                <Badge>{item.status}</Badge>
              )}
            </Card>
          ))
        )}
      </section>

      <Link to="/" className={buttonClass('ghost', 'md', 'self-start')}>
        Kembali ke beranda
      </Link>
    </div>
  );
}
