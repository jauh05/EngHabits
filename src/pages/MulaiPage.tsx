import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { AuthFrame } from '../components/auth/AuthFrame';
import { Button, buttonClass } from '../components/ui/Button';
import { SlideScene, type SceneKind } from '../components/ui/SlideScene';

const SLIDES = [
  {
    scene: 'sunrise' as SceneKind,
    first: 'Ambil napas.',
    second: 'Belajar tanpa terburu-buru.',
    body: 'Dua jam sehari selama 90 hari. Satu kebiasaan kecil setiap pagi.',
  },
  {
    scene: 'books' as SceneKind,
    first: 'Setiap hari',
    second: 'satu langkah kecil.',
    body: 'Kosakata, materi, latihan, dan soal dalam satu sesi yang tertata.',
  },
  {
    scene: 'chart' as SceneKind,
    first: 'Pantau',
    second: 'kemajuanmu.',
    body: 'Lihat skor, kesalahan, dan jadwal ulang yang diatur otomatis.',
  },
];

/** Kata yang memakai tanda hubung tidak boleh patah di tengah, misalnya "terburu-buru". */
function keepHyphenated(text: string) {
  return text.split(/(\S*-\S*)/).map((part, index) =>
    part.includes('-') ? (
      <span key={index} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/** Layar mulai tiga slide, pola seperti gambar 5. Tombol "Lewati" langsung ke daftar. */
export function MulaiPage() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const last = index === SLIDES.length - 1;

  return (
    <AuthFrame
      art={
        <>
          <button
            type="button"
            onClick={() => navigate('/daftar')}
            className="absolute right-0 top-0 z-10 min-h-11 rounded-full px-3 font-semibold text-white outline-none focus-visible:outline-2 focus-visible:outline-primary-500"
          >
            Lewati
          </button>
          <SlideScene kind={slide.scene} />
        </>
      }
    >
      <div className="flex flex-col gap-3 text-center lg:text-left">
        <h1 className="text-balance text-[1.75rem] font-extrabold leading-tight text-ink sm:text-3xl lg:text-4xl">
          {slide.first}
          <br />
          <span className="text-muted">{keepHyphenated(slide.second)}</span>
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

      <div className="flex flex-col items-center gap-3 text-center text-sm text-muted">
        <p>Sudah punya akun?</p>
        <Link to="/masuk" className={buttonClass('secondary', 'lg', 'w-full hover:scale-[1.02]')}>
          Masuk
        </Link>
      </div>
    </AuthFrame>
  );
}
