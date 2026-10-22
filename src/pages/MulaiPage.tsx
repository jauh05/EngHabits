import { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Sunrise, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { ArtTile, AuthFrame } from '../components/auth/AuthFrame';
import { Button } from '../components/ui/Button';

const SLIDES = [
  {
    icon: Sunrise,
    tint: 'bg-tint-sun',
    first: 'Ambil napas.',
    second: 'Belajar tanpa terburu-buru.',
    body: 'Dua jam sehari selama 90 hari. Satu kebiasaan kecil setiap pagi.',
  },
  {
    icon: BookOpen,
    tint: 'bg-tint-sky',
    first: 'Setiap hari',
    second: 'satu langkah kecil.',
    body: 'Kosakata, materi, latihan, dan soal dalam satu sesi yang tertata.',
  },
  {
    icon: TrendingUp,
    tint: 'bg-tint-mint',
    first: 'Pantau',
    second: 'kemajuanmu.',
    body: 'Lihat skor, kesalahan, dan jadwal ulang yang diatur otomatis.',
  },
];

/** Layar mulai tiga slide, pola seperti gambar 5. Tombol "Lewati" langsung ke daftar. */
export function MulaiPage() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const last = index === SLIDES.length - 1;
  const Icon = slide.icon;

  return (
    <AuthFrame
      art={
        <>
          <div className="mb-6 flex w-full justify-end">
            <button
              type="button"
              onClick={() => navigate('/daftar')}
              className="min-h-11 rounded-full px-3 font-semibold text-primary-700 outline-none focus-visible:outline-2 focus-visible:outline-primary-500"
            >
              Lewati
            </button>
          </div>
          <ArtTile tint={slide.tint}>
            <Icon size={56} aria-hidden="true" strokeWidth={1.75} />
          </ArtTile>
        </>
      }
    >
      <div className="flex flex-col gap-3 text-center lg:text-left">
        <h1 className="text-3xl font-extrabold leading-tight text-ink lg:text-4xl">
          {slide.first}
          <br />
          <span className="text-muted">{slide.second}</span>
        </h1>
        <p className="text-base text-muted">{slide.body}</p>
      </div>

      <div className="flex justify-center gap-2 lg:justify-start" aria-label={`Slide ${index + 1} dari ${SLIDES.length}`}>
        {SLIDES.map((_, dot) => (
          <span
            key={dot}
            aria-hidden="true"
            className={`h-2 rounded-full transition-all ${dot === index ? 'w-6 bg-primary-500' : 'w-2 bg-primary-300/60'}`}
          />
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Slide sebelumnya"
          disabled={index === 0}
          onClick={() => setIndex((value) => value - 1)}
          className="grid size-14 shrink-0 place-items-center rounded-full border border-line text-ink outline-none transition-opacity focus-visible:outline-2 focus-visible:outline-primary-500 disabled:opacity-40"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        {last ? (
          <Button size="lg" className="flex-1" onClick={() => navigate('/daftar')}>
            Mulai
            <ArrowRight size={20} aria-hidden="true" />
          </Button>
        ) : (
          <Button size="lg" className="flex-1" onClick={() => setIndex((value) => value + 1)}>
            Lanjut
            <ArrowRight size={20} aria-hidden="true" />
          </Button>
        )}
      </div>

      <p className="text-center text-sm text-muted">
        Sudah punya akun?{' '}
        <Link to="/masuk" className="font-semibold text-primary-700 underline underline-offset-4">
          Masuk
        </Link>
      </p>
    </AuthFrame>
  );
}
