import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Check, X } from 'lucide-react';
import { VersusBadge } from '../ui/BattleIllustrations';
import { BattleLoading } from '../ui/BattleLoading';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { getBattle, openBattleStream, respondBattle, type Invite } from '../../lib/battle';
import { useSettings } from '../../lib/settings';

/** Sama dengan INVITE_TTL_MS di server. Undangan yang tidak dijawab kedaluwarsa setelah 10 menit. */
const INVITE_WAIT_MS = 10 * 60_000;
/** Jeda loading sebelum masuk ruang battle. Kedua pemain menerima sinyal mulai dari server, lalu pindah bersama. */
const ENTER_DELAY_MS = 1800;
/** Jeda sebelum menyambung ulang aliran SSE yang terputus. */
const RECONNECT_MS = 3000;

export type OutgoingBattle = {
  battleId: string;
  opponentName: string;
  modeLabel: string;
  total: number;
  poolDay: number;
};

type BattleSignalValue = {
  /** Undangan masuk yang belum dijawab. Yang terbaru ada di depan. */
  incoming: Invite[];
  /** Sedang mengirim jawaban undangan. */
  responding: boolean;
  respondInvite: (invite: Invite, accept: boolean) => Promise<void>;
  /** Menunggu teman menerima undangan yang baru dikirim. */
  startWaiting: (battle: OutgoingBattle) => void;
};

const BattleSignalContext = createContext<BattleSignalValue | null>(null);

const noop = () => undefined;

/**
 * Sinyal battle untuk seluruh aplikasi. Undangan masuk tampil sebagai modal di halaman mana pun,
 * undangan yang dikirim ditunggu lewat modal, dan saat diterima kedua pemain masuk ruang battle bersama.
 */
export function BattleSignalProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const { show } = useToast();
  const navigate = useNavigate();
  const token = settings.signedIn ? settings.token : '';
  const [incoming, setIncoming] = useState<Invite[]>([]);
  const [outgoing, setOutgoing] = useState<OutgoingBattle | null>(null);
  const [waitingOpen, setWaitingOpen] = useState(false);
  const [responding, setResponding] = useState(false);
  const [entering, setEntering] = useState(false);
  const [streamKey, setStreamKey] = useState(0);
  // Battle yang sedang ditunggu mulainya: id battle -> nama lawan. Dihapus saat battle mulai atau ditolak.
  const watchRef = useRef(new Map<string, string>());
  // Navigasi disimpan di ref, supaya aliran SSE tidak tersambung ulang setiap pindah halaman.
  const navigateRef = useRef(navigate);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  const startEntering = useCallback((battleId: string) => {
    watchRef.current.delete(battleId);
    setOutgoing((current) => (current?.battleId === battleId ? null : current));
    setIncoming((list) => list.filter((item) => item.battleId !== battleId));
    setWaitingOpen(false);
    setEntering(true);
    window.setTimeout(() => {
      setEntering(false);
      navigateRef.current(`/battle/${battleId}`);
    }, ENTER_DELAY_MS);
  }, []);

  /** Menerapkan status battle yang sedang ditunggu. Battle lain diabaikan. */
  const settle = useCallback(
    (battleId: string, status: string) => {
      const opponentName = watchRef.current.get(battleId);
      if (opponentName === undefined) return;
      if (status === 'active') {
        startEntering(battleId);
      } else if (status === 'declined') {
        watchRef.current.delete(battleId);
        setOutgoing((current) => (current?.battleId === battleId ? null : current));
        show(`${opponentName} menolak undangan.`);
      }
    },
    [show, startEntering],
  );

  useEffect(() => {
    if (!token) return;
    let retry: number | undefined;
    const close = openBattleStream(
      token,
      (event) => {
        if (event.type === 'invites') {
          setIncoming(event.invites);
          // Koneksi yang baru tersambung bisa melewatkan perubahan saat terputus, jadi status battle yang ditunggu dicek ulang.
          for (const battleId of Array.from(watchRef.current.keys())) {
            getBattle(token, battleId)
              .then((snapshot) => settle(battleId, snapshot.status))
              .catch(() => undefined);
          }
        }
        if (event.type === 'invite') {
          setIncoming((list) => [event.invite, ...list.filter((item) => item.battleId !== event.invite.battleId)]);
        }
        if (event.type === 'battle') settle(event.battle.id, event.battle.status);
      },
      () => {
        retry = window.setTimeout(() => setStreamKey((key) => key + 1), RECONNECT_MS);
      },
    );
    return () => {
      close();
      window.clearTimeout(retry);
    };
  }, [token, settle, streamKey]);

  // Undangan yang dikirim kedaluwarsa bila teman tidak menjawab dalam 10 menit.
  useEffect(() => {
    if (!outgoing) return;
    const timer = window.setTimeout(() => {
      watchRef.current.delete(outgoing.battleId);
      setOutgoing(null);
      show('Undangan sudah kedaluwarsa. Coba undang lagi.', 'error');
    }, INVITE_WAIT_MS);
    return () => window.clearTimeout(timer);
  }, [outgoing, show]);

  const startWaiting = useCallback((battle: OutgoingBattle) => {
    watchRef.current.set(battle.battleId, battle.opponentName);
    setOutgoing(battle);
    setWaitingOpen(true);
  }, []);

  const respondInvite = useCallback(
    async (invite: Invite, accept: boolean) => {
      if (!token) return;
      const name = invite.from?.name ?? 'Pemain';
      setResponding(true);
      try {
        if (!accept) {
          await respondBattle(token, invite.battleId, false);
          setIncoming((list) => list.filter((item) => item.battleId !== invite.battleId));
          show(`Undangan dari ${name} ditolak.`);
          return;
        }
        // Dicatat dulu, supaya sinyal "aktif" dari aliran SSE juga bisa memulai masuk.
        watchRef.current.set(invite.battleId, name);
        const result = await respondBattle(token, invite.battleId, true);
        settle(invite.battleId, result.status);
      } catch (caught) {
        watchRef.current.delete(invite.battleId);
        setIncoming((list) => list.filter((item) => item.battleId !== invite.battleId));
        show(caught instanceof Error ? caught.message : 'Undangan tidak bisa diproses.', 'error');
      } finally {
        setResponding(false);
      }
    },
    [token, show, settle],
  );

  const value = useMemo(
    () => ({ incoming, responding, respondInvite, startWaiting }),
    [incoming, responding, respondInvite, startWaiting],
  );

  const current = incoming[0];

  return (
    <BattleSignalContext.Provider value={value}>
      {children}

      {/* Undangan masuk hanya bisa dijawab dengan Tolak atau Terima, jadi klik di luar modal tidak menutupnya. */}
      <Modal open={Boolean(current)} onClose={noop} title="Undangan battle">
        {current && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <VersusBadge className="size-16 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-ink">{current.from?.name ?? 'Pemain'} mengajakmu battle</p>
                <p className="text-sm text-muted">
                  {current.modeLabel} · {current.total} soal
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onClick={() => void respondInvite(current, false)} disabled={responding}>
                <X size={18} aria-hidden="true" />
                Tolak
              </Button>
              <Button onClick={() => void respondInvite(current, true)} disabled={responding}>
                <Check size={18} aria-hidden="true" />
                Terima
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={waitingOpen && Boolean(outgoing)} onClose={() => setWaitingOpen(false)} title="Menunggu teman">
        {outgoing && (
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="relative grid size-28 place-items-center">
              <span
                aria-hidden="true"
                className="absolute inset-0 animate-spin rounded-full border-[6px] border-track border-t-primary-500"
              />
              <VersusBadge className="size-14" />
            </div>
            <div className="flex flex-col gap-2">
              <p role="status" className="font-bold text-ink">
                Menunggu {outgoing.opponentName} menerima undangan…
              </p>
              <p className="text-sm text-muted">
                {outgoing.modeLabel} · {outgoing.total} soal dari hari 1 sampai {outgoing.poolDay}
              </p>
              <p className="text-sm text-muted">Kamu masuk otomatis begitu teman menerima.</p>
            </div>
            <Button variant="secondary" onClick={() => setWaitingOpen(false)}>
              Tutup
            </Button>
          </div>
        )}
      </Modal>

      {entering && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-bg px-4">
          <BattleLoading label="Battle dimulai bersama lawanmu…" />
        </div>
      )}
    </BattleSignalContext.Provider>
  );
}

export function useBattleSignal(): BattleSignalValue {
  const ctx = useContext(BattleSignalContext);
  if (!ctx) throw new Error('useBattleSignal harus dipakai di dalam BattleSignalProvider');
  return ctx;
}
