import { MotionConfig } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Confetti } from '../components/ui/Confetti';
import { CountUp } from '../components/ui/CountUp';
import { FlipCard } from '../components/ui/FlipCard';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ProgressRing } from '../components/ui/ProgressRing';
import { Stepper, type StepperStep } from '../components/ui/Stepper';
import { useToast } from '../components/ui/Toast';

const SWATCHES = [
  { name: 'bg', label: 'Latar' },
  { name: 'surface', label: 'Kartu' },
  { name: 'primary-100', label: 'Primary 100' },
  { name: 'primary-300', label: 'Primary 300' },
  { name: 'primary-500', label: 'Primary 500' },
  { name: 'primary-700', label: 'Primary 700' },
  { name: 'ink', label: 'Teks' },
  { name: 'muted', label: 'Teks lembut' },
  { name: 'success', label: 'Benar' },
  { name: 'error', label: 'Salah' },
  { name: 'streak', label: 'Streak' },
];

const STEPS: StepperStep[] = [
  { id: 'vocab', label: 'Kosakata' },
  { id: 'lesson', label: 'Materi' },
  { id: 'reading', label: 'Latihan' },
  { id: 'drill', label: 'Soal' },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = `sec-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className="text-lg font-bold text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ToggleButton({
  pressed,
  onPress,
  children,
}: {
  pressed: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Button variant={pressed ? 'primary' : 'secondary'} size="md" aria-pressed={pressed} onClick={onPress}>
      {children}
    </Button>
  );
}

/**
 * Katalog komponen /design. Hanya tersedia di mode dev (npm run dev), tidak ikut build produksi.
 */
export function DesignCatalog() {
  const { show } = useToast();
  const [dark, setDark] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [step, setStep] = useState(1);
  const [dayValue, setDayValue] = useState(0.4);
  const [score, setScore] = useState(820);
  const [modalOpen, setModalOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [flipKey, setFlipKey] = useState(0);

  const applyTheme = (next: boolean) => {
    setDark(next);
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
  };

  const applyReduce = (next: boolean) => {
    setReduce(next);
    document.documentElement.dataset.reduceMotion = String(next);
  };

  return (
    <MotionConfig reducedMotion={reduce ? 'always' : 'user'}>
      <main className="mx-auto flex max-w-2xl flex-col gap-10 px-4 py-8 pb-28">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-primary-700">Dev only · /design</p>
          <h1 className="text-3xl font-extrabold text-ink">Katalog komponen EngHabits</h1>
          <p className="text-muted">
            Semua komponen dasar dan animasinya. Halaman ini tidak ikut build produksi.
          </p>
        </header>

        <Section title="Pengaturan tampilan">
          <div className="flex flex-wrap gap-2">
            <ToggleButton pressed={!dark} onPress={() => applyTheme(false)}>
              Mode terang
            </ToggleButton>
            <ToggleButton pressed={dark} onPress={() => applyTheme(true)}>
              Mode gelap
            </ToggleButton>
            <ToggleButton pressed={reduce} onPress={() => applyReduce(!reduce)}>
              Kurangi animasi
            </ToggleButton>
          </div>
        </Section>

        <Section title="Palet">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SWATCHES.map((swatch) => (
              <li key={swatch.name} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
                <span
                  aria-hidden="true"
                  className="size-10 shrink-0 rounded-xl border border-line"
                  style={{ backgroundColor: `var(--${swatch.name})` }}
                />
                <span className="text-sm font-semibold text-ink">
                  {swatch.label}
                  <span className="block text-xs font-normal text-muted">--{swatch.name}</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Tombol">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Mulai sesi</Button>
            <Button variant="secondary">Lewati</Button>
            <Button variant="ghost">Lihat semua</Button>
            <Button size="lg">Lanjut hari ke-2</Button>
            <Button size="icon" aria-label="Cari">
              <span aria-hidden="true">🔍</span>
            </Button>
            <Button disabled>Nonaktif</Button>
          </div>
        </Section>

        <Section title="Kartu & lencana">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card interactive>
              <p className="text-sm text-muted">Kartu interaktif</p>
              <p className="text-lg font-bold">Yoga Group</p>
              <p className="text-sm text-muted">Angkat kartu saat disentuh</p>
            </Card>
            <Card tone="lavender">
              <p className="text-sm text-muted">Kartu lavender</p>
              <p className="text-lg font-bold">Balance</p>
            </Card>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="easy" />
            <Badge tone="medium" />
            <Badge tone="hard" />
            <Badge tone="lavender">Lavender</Badge>
            <Badge tone="streak">Streak 7 hari</Badge>
          </div>
        </Section>

        <Section title="Input">
          <Input label="Jawaban kamu" placeholder="Tulis dalam Bahasa Inggris" hint="Huruf besar kecil tidak dihitung salah" />
        </Section>

        <Section title="Stepper 4 blok">
          <Stepper steps={STEPS} current={step} onSelect={setStep} />
          <div className="flex gap-2">
            <Button variant="secondary" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
              Sebelumnya
            </Button>
            <Button disabled={step === STEPS.length - 1} onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
              Berikutnya
            </Button>
          </div>
        </Section>

        <Section title="Progres">
          <div className="flex flex-wrap items-center gap-6">
            <ProgressRing value={dayValue} size={132} stroke={12}>
              <span className="text-2xl font-extrabold text-ink">
                <CountUp value={Math.round(dayValue * 90)} />
                <span className="text-sm font-semibold text-muted"> / 90</span>
              </span>
            </ProgressRing>
            <div className="flex flex-col gap-2">
              <Button variant="secondary" onClick={() => setDayValue((v) => Math.min(1, v + 0.1))}>
                Tambah progres
              </Button>
              <Button variant="ghost" onClick={() => setDayValue(0)}>
                Reset
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-lg font-bold text-ink">
              Skor: <CountUp value={score} className="text-primary-700" />
            </p>
            <Button size="md" variant="secondary" onClick={() => setScore(Math.round(Math.random() * 1000))}>
              Acak skor
            </Button>
          </div>
        </Section>

        <Section title="Flashcard (klik untuk membalik)">
          <FlipCard
            key={flipKey}
            front={<span className="text-3xl font-extrabold text-ink">Schedule</span>}
            back={
              <span className="flex flex-col gap-2">
                <span className="text-xl font-bold text-primary-700">/ˈskedʒuːl/ · jadwal</span>
                <span className="text-sm text-ink">I have a busy schedule today.</span>
              </span>
            }
          />
          <Button variant="ghost" onClick={() => setFlipKey((k) => k + 1)}>
            Reset kartu
          </Button>
        </Section>

        <Section title="Toast & modal">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => show('Tersimpan', 'neutral')}>
              Toast netral
            </Button>
            <Button variant="secondary" onClick={() => show('Jawaban benar!', 'success')}>
              Toast benar
            </Button>
            <Button variant="secondary" onClick={() => show('Coba lagi, ya', 'error')}>
              Toast salah
            </Button>
            <Button onClick={() => setModalOpen(true)}>Buka modal</Button>
          </div>
          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Lewati sesi ini?">
            <p className="mb-5 text-muted">Progres yang sudah tersimpan tidak akan hilang.</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Batal
              </Button>
              <Button onClick={() => setModalOpen(false)}>Lewati</Button>
            </div>
          </Modal>
        </Section>

        <Section title="Perayaan">
          <div>
            <Button onClick={() => setCelebrate(true)}>Mainkan confetti</Button>
          </div>
          {celebrate && <Confetti />}
          {celebrate && (
            <Button variant="ghost" onClick={() => setCelebrate(false)}>
              Lewati perayaan
            </Button>
          )}
        </Section>
      </main>
    </MotionConfig>
  );
}
