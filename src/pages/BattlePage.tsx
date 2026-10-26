import { useEffect, useState, type FormEvent } from 'react';
import { BookOpen, Brain, Check, Copy, Ear, FileText, Heart, Languages, Library, ListOrdered, Sparkles, Swords, Trash2, UserPlus, X, Zap, type LucideIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { BattleCrest, VersusBadge } from '../components/ui/BattleIllustrations';
import { Badge } from '../components/ui/Badge';
import { Button, buttonClass } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import {
  addFriend,
  BATTLE_MODES,
  BATTLE_TOTALS,
  createBattle,
  type Friend,
  listBattles,
  listFriends,
  openBattleStream,
  previewBattle,
  removeFriend,
  respondBattle,
  type BattleMode,
  type Preview,
  type BattleSummary,
  type Composition,
  type Invite,
  type QuestionType,
} from '../lib/battle';
import { defaultCompositionFor, needsComposition, typesFor } from '../lib/battleRules';
import { useSettings } from '../lib/settings';

const TYPE_LABEL: Record<QuestionType, string> = {
  mcq: 'Pilihan ganda',
  translate: 'Terjemahan',
  story: 'Cerita',
  essay: 'Esai',
  listen: 'Dengar',
  reorder: 'Susun kalimat',
};

const MODE_ICON: Record<BattleMode, LucideIcon> = {
  kilat: Zap,
  terjemahan: Languages,
  tata_bahasa: Brain,
  kosakata: Library,
  cerita: BookOpen,
  esai: FileText,
  campuran: Sparkles,
  dengar: Ear,
  susun: ListOrdered,
  bertahan: Heart,
};

/** Warna kartu mode, dengan tepi 3D seperti kartu lain di aplikasi. */
const MODE_TONE: Record<BattleMode, string> = {
  kilat: 'bg-tint-sun [--edge:color-mix(in_srgb,var(--tint-sun),var(--shade)_18%)]',
  terjemahan: 'bg-tint-sky [--edge:color-mix(in_srgb,var(--tint-sky),var(--shade)_18%)]',
  tata_bahasa: 'bg-primary-100 [--edge:color-mix(in_srgb,var(--primary-100),var(--shade)_18%)]',
  kosakata: 'bg-tint-mint [--edge:color-mix(in_srgb,var(--tint-mint),var(--shade)_18%)]',
  cerita: 'bg-tint-peach [--edge:color-mix(in_srgb,var(--tint-peach),var(--shade)_18%)]',
  esai: 'bg-tint-rose [--edge:color-mix(in_srgb,var(--tint-rose),var(--shade)_18%)]',
  campuran: 'bg-lime [--edge:color-mix(in_srgb,var(--lime),var(--shade)_18%)]',
  dengar: 'bg-mint-deep [--edge:color-mix(in_srgb,var(--mint-deep),var(--shade)_18%)]',
  susun: 'bg-tint-pale [--edge:color-mix(in_srgb,var(--tint-pale),var(--shade)_18%)]',
  bertahan: 'bg-tint-rose [--edge:color-mix(in_srgb,var(--tint-rose),var(--shade)_18%)]',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu',
  active: 'Berjalan',
  rating: 'Menilai esai',
  expired: 'Kedaluwarsa',
  declined: 'Ditolak',
  cancelled: 'Dibatalkan',
};

const MAX_MODES = 3;

/** Lobi battle: ID saya, undangan masuk, kirim undangan, dan riwayat. */
export function BattlePage() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { show } = useToast();
  const token = settings.token;
  const myId = settings.account?.publicId ?? '';
  const [invites, setInvites] = useState<Invite[]>([]);
  const [history, setHistory] = useState<BattleSummary[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendId, setFriendId] = useState('');
  const [warning, setWarning] = useState<{ publicId: string; preview: Preview }>();
  const [modes, setModes] = useState<BattleMode[]>(['kilat']);
  const [total, setTotal] = useState<(typeof BATTLE_TOTALS)[number]>(8);
  const [composition, setComposition] = useState<Composition>(defaultCompositionFor(['kilat'], 8));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [connected, setConnected] = useState(true);

  // Daftar teman dan status online diperbarui setiap 30 detik.
  useEffect(() => {
    if (!token) return;
    const load = () => listFriends(token).then(setFriends).catch(() => undefined);
    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(timer);
  }, [token]);

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

  const resetComposition = (nextModes: BattleMode[], nextTotal: (typeof BATTLE_TOTALS)[number]) => {
    setComposition(defaultCompositionFor(nextModes, nextTotal));
  };

  const toggleMode = (mode: BattleMode) => {
    let next: BattleMode[];
    if (mode === 'campuran') {
      next = modes.includes('campuran') && modes.length === 1 ? ['kilat'] : ['campuran'];
    } else if (modes.includes(mode)) {
      next = modes.filter((item) => item !== mode);
      if (next.length === 0) next = ['kilat'];
    } else {
      const base = modes.filter((item) => item !== 'campuran');
      if (base.length >= MAX_MODES) {
        show(`Pilih paling banyak ${MAX_MODES} mode.`, 'error');
        return;
      }
      next = [...base, mode];
    }
    setModes(next);
    resetComposition(next, total);
  };

  const changeTotal = (next: (typeof BATTLE_TOTALS)[number]) => {
    setTotal(next);
    resetComposition(modes, next);
  };

  const adjust = (type: QuestionType, delta: number) => {
    setComposition((current) => ({ ...current, [type]: Math.max(0, (current[type] ?? 0) + delta) }));
  };

  const editable = needsComposition(modes);
  const types = editable ? typesFor(modes) : [];
  const sum = Object.values(composition).reduce((acc, value) => acc + (value ?? 0), 0);
  const compositionOk = !editable || sum === total;

  const sendInvite = async (publicId: string) => {
    if (!token) return;
    setBusy(true);
    try {
      const result = await createBattle(token, {
        opponentPublicId: publicId,
        mode: modes.join('+') as BattleMode,
        total,
        composition: editable ? composition : undefined,
      });
      show(`Undangan terkirim. Level battle: hari 1 sampai ${result.poolDay}.`, 'success');
    } catch (caught) {
      show(caught instanceof Error ? caught.message : 'Undangan gagal dikirim.', 'error');
    } finally {
      setBusy(false);
    }
  };

  /** Undang teman: periksa dulu ketersediaan soal, lalu tampilkan peringatan bila bank kurang. */
  const invite = async (publicId: string) => {
    if (!token) return;
    if (!compositionOk) {
      setError(`Jumlah tipe soal harus tepat ${total}.`);
      return;
    }
    setError(undefined);
    setBusy(true);
    try {
      const preview = await previewBattle(token, {
        opponentPublicId: publicId,
        mode: modes.join('+') as BattleMode,
        total,
        composition: editable ? composition : undefined,
      });
      if (preview.shortage.length > 0) {
        setWarning({ publicId, preview });
        return;
      }
      await sendInvite(publicId);
    } catch (caught) {
      show(caught instanceof Error ? caught.message : 'Undangan gagal dicek.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const addFriendById = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !friendId.trim()) return;
    try {
      const friend = await addFriend(token, friendId.trim());
      setFriends((list) => [...list.filter((item) => item.publicId !== friend.publicId), friend]);
      setFriendId('');
      show(`${friend.name} ditambahkan ke teman.`, 'success');
    } catch (caught) {
      show(caught instanceof Error ? caught.message : 'Teman tidak bisa ditambahkan.', 'error');
    }
  };

  const deleteFriend = async (publicId: string) => {
    if (!token) return;
    try {
      await removeFriend(token, publicId);
      setFriends((list) => list.filter((item) => item.publicId !== publicId));
    } catch (caught) {
      show(caught instanceof Error ? caught.message : 'Teman tidak bisa dihapus.', 'error');
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

  const modeLabel = modes.map((mode) => BATTLE_MODES.find((item) => item.id === mode)?.label ?? mode).join(' + ');

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
            <p className="break-all text-lg font-extrabold tracking-wide text-ink sm:text-2xl">{myId || 'Memuat ID…'}</p>
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

      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-primary-100 text-primary-700">
            <UserPlus size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-ink">Teman</h2>
            <p className="text-sm text-muted">Tambahkan sekali dengan ID, lalu undang tanpa mengetik ID lagi.</p>
          </div>
        </div>

        {friends.length === 0 ? (
          <p className="text-sm text-muted">Belum ada teman. Tambahkan dengan ID di bawah.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {friends.map((friend) => (
              <li key={friend.publicId} className="flex items-center gap-3 rounded-2xl bg-bg p-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate font-bold text-ink">
                    <span
                      aria-hidden="true"
                      className={`inline-block size-2.5 shrink-0 rounded-full ${friend.online ? 'bg-success' : 'bg-muted/40'}`}
                    />
                    {friend.name}
                  </p>
                  <p className="break-all text-xs font-semibold text-muted">
                    {friend.online ? 'Online' : 'Offline'} · {friend.publicId}
                  </p>
                </div>
                <Button size="md" onClick={() => invite(friend.publicId)} disabled={busy}>
                  Undang
                </Button>
                <Button variant="ghost" size="icon" aria-label={`Hapus ${friend.name} dari teman`} onClick={() => deleteFriend(friend.publicId)}>
                  <Trash2 size={18} aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={addFriendById} className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
          <div className="min-w-0 flex-1">
            <Input
              label="Tambah teman dengan ID"
              name="id-teman"
              autoComplete="off"
              value={friendId}
              onChange={(event) => setFriendId(event.target.value)}
              placeholder="EH-XXXXXX"
            />
          </div>
          <Button type="submit" size="md" disabled={!friendId.trim()}>
            Tambah teman
          </Button>
        </form>
      </Card>

      <Card className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-primary-100 text-primary-700">
            <Swords size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-ink">Atur battle</h2>
            <p className="text-sm text-muted">Pengaturan ini dipakai saat kamu menekan Undang.</p>
          </div>
        </div>

        <div className="flex flex-col gap-6">

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-semibold text-ink">
              Mode <span className="font-normal text-muted">(pilih sampai {MAX_MODES})</span>
            </legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {BATTLE_MODES.map((option) => {
                const selected = modes.includes(option.id);
                const Icon = MODE_ICON[option.id];
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleMode(option.id)}
                    className={`relative flex min-h-28 flex-col items-start gap-2 rounded-card p-3 text-left text-ink shadow-card outline-none transition-transform active:translate-y-[3px] focus-visible:outline-2 focus-visible:outline-primary-500 ${MODE_TONE[option.id]} ${
                      selected ? 'ring-4 ring-primary-500/70' : ''
                    }`}
                  >
                    <span className="grid size-9 place-items-center rounded-xl bg-surface/80 text-primary-700">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <span className="text-sm font-extrabold leading-tight">{option.label}</span>
                    <span className="text-xs font-semibold leading-snug text-ink/75">{option.hint}</span>
                    {selected && (
                      <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-btn-bg text-btn-fg">
                        <Check size={14} aria-hidden="true" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-muted">Dipilih: {modeLabel}</p>
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

          {editable && (
            <fieldset className="flex flex-col gap-3 rounded-2xl bg-bg p-4">
              <legend className="px-1 text-sm font-semibold text-ink">Jenis soal</legend>
              {types.map((type) => (
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

        </div>
      </Card>

      <Modal open={Boolean(warning)} onClose={() => setWarning(undefined)} title="Bank soal belum cukup">
        {warning && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink">
              Battle ini membutuhkan {warning.preview.requested} soal, tetapi bank untuk hari 1 sampai {warning.preview.poolDay} belum cukup:
            </p>
            <ul className="flex flex-col gap-2 text-sm text-ink">
              {warning.preview.shortage.map((item) => (
                <li key={item.type} className="flex justify-between gap-3 rounded-2xl bg-bg px-3 py-2">
                  <span className="font-semibold">{TYPE_LABEL[item.type]}</span>
                  <span className="tabular-nums">
                    butuh {item.requested}, tersedia {item.available}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted">
              Battle tetap bisa dilanjutkan dengan {warning.preview.adjustedTotal} soal. Jenis soal yang kurang akan dikurangi.
            </p>
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onClick={() => setWarning(undefined)}>
                Batal
              </Button>
              <Button
                onClick={async () => {
                  const target = warning.publicId;
                  setWarning(undefined);
                  await sendInvite(target);
                }}
              >
                Lanjut tetap
              </Button>
            </div>
          </div>
        )}
      </Modal>

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
                <Badge>{STATUS_LABEL[item.status] ?? item.status}</Badge>
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
