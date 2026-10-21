import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { resetProgress, type Settings } from '../lib/db';
import { hasEnglishVoice, speak, ttsSupported } from '../lib/tts';
import { useSettings } from '../lib/settings';

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
            className={`flex min-h-11 items-center justify-center rounded-2xl border px-3 text-sm font-semibold outline-none focus-visible:outline-2 focus-visible:outline-primary-500 ${
              selected ? 'border-primary-500 bg-primary-100 text-primary-700' : 'border-line bg-surface text-ink'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function ProfilePage() {
  const { settings, update } = useSettings();
  const { show } = useToast();
  const [confirmReset, setConfirmReset] = useState(false);
  const voiceReady = ttsSupported() && hasEnglishVoice();

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

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-extrabold text-ink">Profil & pengaturan</h1>
      </header>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-ink">Tampilan</h2>
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
            className="size-6 accent-[var(--primary-500)]"
          />
        </label>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-ink">Suara (text-to-speech)</h2>
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
            className="h-11 accent-[var(--primary-500)]"
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
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-ink">Data belajar</h2>
        <p className="text-sm text-muted">
          Reset menghapus semua progres, percobaan, dan Buku Kesalahan. Pengaturan tampilan tetap tersimpan.
        </p>
        <Button variant="secondary" onClick={() => setConfirmReset(true)} >
          Reset progres
        </Button>
      </Card>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Hapus semua progres?">
        <p className="mb-5 text-muted">Tindakan ini tidak bisa dibatalkan. Simpan cadangan jika masih perlu datanya.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmReset(false)}>
            Batal
          </Button>
          <Button onClick={handleReset}>Ya, hapus</Button>
        </div>
      </Modal>
    </div>
  );
}
