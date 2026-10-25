import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Bell, Check, Download, Palette, RotateCcw, UserRound, Upload, Volume2, type LucideIcon } from 'lucide-react';
import { spring } from '../lib/motion';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { applyBackup, buildBackupText, parseBackupText } from '../lib/backup';
import { resetProgress, type BackupData, type Settings } from '../lib/db';
import { localISO } from '../lib/dates';
import { hasEnglishVoice, speak, subscribeVoices, ttsSupported } from '../lib/tts';
import { logoutAccount } from '../lib/auth';
import { regeneratePublicId } from '../lib/battle';
import { useSettings } from '../lib/settings';
import { REMINDER_HOUR } from '../components/layout/ReminderWatcher';

/**
 * Satu warna per bagian, hanya di kotak ikon. Latar kartu tetap putih supaya warna tidak bertabrakan.
 * Ungu tetap dipakai untuk pilihan yang aktif.
 */
const SECTION_TINT = {
  display: { box: 'bg-lime', icon: 'text-ink' },
  voice: { box: 'bg-mint-deep', icon: 'text-ink' },
  reminder: { box: 'bg-tint-mint', icon: 'text-ink' },
  backup: { box: 'bg-forest', icon: 'text-white' },
  data: { box: 'bg-tint-rose', icon: 'text-ink' },
} as const;

function SectionCard({
  icon: Icon,
  tint,
  title,
  children,
  className = '',
}: {
  icon: LucideIcon;
  tint: { box: string; icon: string };
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`flex flex-col gap-4 ${className}`}>
      <div className="flex items-center gap-3">
        <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${tint.box}`}>
          <Icon size={20} aria-hidden="true" className={tint.icon} />
        </span>
        <h2 className="text-lg font-bold text-ink">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

function Choice<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (next: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="grid grid-cols-2 gap-2">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`flex min-h-14 items-center justify-between gap-2 rounded-2xl border px-4 text-left text-sm font-semibold outline-none focus-visible:outline-2 focus-visible:outline-primary-500 ${
              selected ? 'border-primary-500 bg-primary-100 text-primary-700' : 'border-line bg-surface text-ink'
            }`}
          >
            <span>{option.label}</span>
            <span
              aria-hidden="true"
              className={`grid size-6 shrink-0 place-items-center rounded-full ${selected ? 'bg-primary-500 text-on-accent' : 'border border-line'}`}
            >
              {selected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={spring}
                  className="grid place-items-center"
                >
                  <Check size={14} strokeWidth={3} />
                </motion.span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Ringkasan isi cadangan untuk konfirmasi sebelum impor. */
function describeBackup(data: BackupData): string {
  return `${data.progress.length} hari selesai, ${data.attempts.length} percobaan, ${data.mistakes.length} entri Buku Kesalahan, ${data.notes.length} catatan.`;
}

export function ProfilePage() {
  const { settings, update } = useSettings();
  const { show } = useToast();

  const regenerateId = async () => {
    if (!settings.token || !settings.account) return;
    try {
      const { account } = await regeneratePublicId(settings.token);
      update({ account: { ...settings.account, publicId: account.publicId, canChangePublicId: false } });
      show('ID battle sudah diganti.', 'success');
    } catch (caught) {
      show(caught instanceof Error ? caught.message : 'ID tidak bisa diganti.', 'error');
    }
  };
  const [confirmReset, setConfirmReset] = useState(false);
  const [reminderNote, setReminderNote] = useState('');
  const [pendingImport, setPendingImport] = useState<BackupData>();
  const fileInput = useRef<HTMLInputElement>(null);
  const [voiceReady, setVoiceReady] = useState(() => ttsSupported() && hasEnglishVoice());

  // Status suara diperbarui saat perangkat selesai memuat daftar voice, supaya tidak tertinggal di "belum ada suara".
  useEffect(() => subscribeVoices(() => setVoiceReady(hasEnglishVoice())), []);

  const set = (patch: Partial<Settings>) => update(patch);

  const handleReset = async () => {
    try {
      await resetProgress();
      show('Progres dihapus. Mulai lagi dari hari 1.', 'success');
    } catch {
      show('Progres gagal dihapus. Coba lagi.', 'error');
    } finally {
      setConfirmReset(false);
    }
  };

  const toggleReminder = async (enabled: boolean) => {
    if (!enabled) {
      set({ reminderEnabled: false });
      setReminderNote('');
      return;
    }
    if (!('Notification' in window)) {
      setReminderNote('Browser ini tidak mendukung notifikasi. Coba browser lain.');
      return;
    }
    const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
    if (permission !== 'granted') {
      setReminderNote('Izin notifikasi ditolak. Aktifkan lewat pengaturan browser, lalu coba lagi.');
      return;
    }
    set({ reminderEnabled: true });
    setReminderNote(
      `Pengingat aktif. Notifikasi muncul sekali sehari setelah jam ${String(REMINDER_HOUR).padStart(2, '0')}.00, selama aplikasi terbuka atau berjalan di latar belakang.`,
    );
  };

  const handleExport = async () => {
    try {
      const text = await buildBackupText();
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `enghabits-${localISO()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      show('Data diekspor. Simpan berkasnya di tempat aman.', 'success');
    } catch {
      show('Ekspor gagal. Coba lagi.', 'error');
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPendingImport(parseBackupText(await file.text()));
    } catch (error) {
      show(error instanceof Error ? error.message : 'Impor gagal.', 'error');
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const confirmImport = async () => {
    if (!pendingImport) return;
    try {
      await applyBackup(pendingImport);
      show('Data diimpor. Buka Beranda untuk melihat progres.', 'success');
    } catch {
      show('Impor gagal. Data lama tidak berubah.', 'error');
    } finally {
      setPendingImport(undefined);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <header className="lg:col-span-2">
        <h1 className="text-3xl font-extrabold text-ink lg:text-4xl">Profil & pengaturan</h1>
      </header>

      {/* Satu-satunya kartu berlatar ungu terang: akun, sebagai sorotan utama halaman. */}
      <Card className="flex flex-col gap-4 lg:col-span-2">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-banner text-white">
            <UserRound size={22} aria-hidden="true" />
          </span>
          <h2 className="text-lg font-bold text-ink">Akun</h2>
        </div>
        {settings.account ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col">
              <p className="font-bold text-ink">{settings.account.name}</p>
              <p className="text-sm text-ink/80">{settings.account.email}</p>
              <p className="text-sm font-semibold text-ink">ID battle: {settings.account.publicId ?? 'memuat…'}</p>
              {settings.account.publicId && settings.account.canChangePublicId !== false && (
                <button type="button" onClick={regenerateId} className="w-fit text-sm font-semibold text-primary-700 underline-offset-4 hover:underline">
                  Ganti ID (sekali saja)
                </button>
              )}
              <p className="text-xs text-muted">Tersimpan di server dan bisa dipakai dari perangkat mana pun.</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                const token = settings.token;
                update({ signedIn: false, token: '' });
                if (token) void logoutAccount(token);
                show('Kamu sudah keluar. Masuk lagi kapan saja.');
              }}
            >
              Keluar
            </Button>
          </div>
        ) : (
          <p className="text-sm text-ink/80">Belum ada akun di perangkat ini.</p>
        )}
      </Card>

      <SectionCard icon={Palette} tint={SECTION_TINT.display} title="Tampilan">
        <Choice
          name="Tema"
          value={settings.theme}
          options={[
            { value: 'light', label: 'Terang' },
            { value: 'dark', label: 'Gelap' },
          ]}
          onChange={(theme) => set({ theme })}
        />
        <label className="flex min-h-11 items-center justify-between gap-4">
          <span className="flex flex-col">
            <span className="font-semibold text-ink">Kurangi animasi</span>
            <span className="text-sm text-muted">Mematikan gerakan dan confetti. Transisi menjadi fade sederhana.</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={settings.reduceMotion}
            onChange={(event) => set({ reduceMotion: event.target.checked })}
            className="size-6 accent-primary-500"
          />
        </label>
      </SectionCard>

      <SectionCard icon={Volume2} tint={SECTION_TINT.voice} title="Suara (text-to-speech)">
        <Choice
          name="Aksen"
          value={settings.accent}
          options={[
            { value: 'en-US', label: 'Amerika' },
            { value: 'en-GB', label: 'Inggris' },
          ]}
          onChange={(accent) => set({ accent })}
        />
        <label className="flex flex-col gap-2">
          <span className="flex justify-between text-sm font-semibold text-ink">
            <span>Kecepatan</span>
            <span className="tabular-nums">{settings.rate.toFixed(1)}x</span>
          </span>
          <input
            type="range"
            min={0.6}
            max={1.2}
            step={0.1}
            value={settings.rate}
            onChange={(event) => set({ rate: Number(event.target.value) })}
            className="h-11 accent-primary-500"
          />
        </label>
        <Button
          variant="secondary"
          disabled={!ttsSupported()}
          onClick={() =>
            speak('Hello, I am learning English every day.', { accent: settings.accent, rate: settings.rate })
          }
        >
          <Volume2 size={18} aria-hidden="true" />
          Coba suara
        </Button>
        <p className="text-sm text-muted">
          {!ttsSupported()
            ? 'Browser ini tidak mendukung suara. Coba browser lain.'
            : voiceReady
              ? 'Suara bahasa Inggris terdeteksi di perangkat ini.'
              : 'Belum ada suara bahasa Inggris. Pasang voice English di pengaturan teks-ke-ucapan perangkatmu (Android, iOS, atau Windows), lalu muat ulang halaman.'}
        </p>
      </SectionCard>

      <SectionCard icon={Bell} tint={SECTION_TINT.reminder} title="Pengingat harian">
        <label className="flex min-h-11 items-center justify-between gap-4">
          <span className="flex flex-col">
            <span className="font-semibold text-ink">Ingatkan jam {String(REMINDER_HOUR).padStart(2, '0')}.00</span>
            <span className="text-sm text-muted">Notifikasi muncul sekali sehari. Butuh izin dari browser.</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={settings.reminderEnabled}
            onChange={(event) => void toggleReminder(event.target.checked)}
            className="size-6 accent-primary-500"
          />
        </label>
        {reminderNote && <p className="text-sm text-muted">{reminderNote}</p>}
      </SectionCard>

      <SectionCard icon={Download} tint={SECTION_TINT.backup} title="Cadangan data">
        <p className="text-sm text-muted">
          Ekspor menyimpan progres, percobaan, Buku Kesalahan, dan catatan ke berkas JSON. Impor menggantikan semua data
          yang ada sekarang dengan isi berkas.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleExport}>
            <Download size={18} aria-hidden="true" />
            Ekspor data
          </Button>
          <Button variant="secondary" onClick={() => fileInput.current?.click()}>
            <Upload size={18} aria-hidden="true" />
            Impor data
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            aria-label="Pilih berkas cadangan"
            className="sr-only"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
        </div>
      </SectionCard>

      <SectionCard icon={RotateCcw} tint={SECTION_TINT.data} title="Data belajar">
        <p className="text-sm text-muted">
          Reset menghapus semua progres, percobaan, dan Buku Kesalahan. Pengaturan tampilan tetap tersimpan.
        </p>
        <Button variant="secondary" onClick={() => setConfirmReset(true)}>
          Reset progres
        </Button>
      </SectionCard>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Hapus semua progres?">
        <p className="mb-5 text-muted">Tindakan ini tidak bisa dibatalkan. Simpan cadangan jika masih perlu datanya.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmReset(false)}>
            Batal
          </Button>
          <Button onClick={handleReset}>Ya, hapus</Button>
        </div>
      </Modal>

      <Modal open={pendingImport !== undefined} onClose={() => setPendingImport(undefined)} title="Ganti data dengan berkas ini?">
        <p className="mb-2 text-muted">Berkas berisi {pendingImport ? describeBackup(pendingImport) : ''}</p>
        <p className="mb-5 text-muted">Semua data yang ada sekarang akan diganti. Tindakan ini tidak bisa dibatalkan.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setPendingImport(undefined)}>
            Batal
          </Button>
          <Button onClick={confirmImport}>Ya, ganti data</Button>
        </div>
      </Modal>
    </div>
  );
}
