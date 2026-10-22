import { ArrowRight, CalendarCheck } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ArtTile, AuthFrame } from '../components/auth/AuthFrame';
import { StackIllustration } from '../components/ui/Illustration';
import { Button } from '../components/ui/Button';
import { currentDay, TOTAL_DAYS } from '../lib/progression';
import { useSettings } from '../lib/settings';
import { useProgressData } from '../lib/useProgressData';

/** Layar sambutan setelah masuk atau daftar. */
export function SambutanPage() {
  const { settings } = useSettings();
  const data = useProgressData();
  const navigate = useNavigate();
  const name = settings.name.trim();
  const next = currentDay(data.mastered);
  const firstTime = data.mastered.size === 0;

  return (
    <AuthFrame
      art={
        <ArtTile tint="bg-tint-peach">
          <StackIllustration className="w-24 sm:w-28" />
        </ArtTile>
      }
    >
      <div className="flex flex-col gap-3 text-center lg:text-left">
        <p className="inline-flex w-fit items-center gap-2 self-center rounded-full bg-primary-100 px-4 py-2 text-sm font-semibold text-primary-700 lg:self-start">
          <CalendarCheck size={16} aria-hidden="true" />
          {firstTime ? 'Hari pertamamu' : 'Selamat kembali'}
        </p>
        <h1 className="text-3xl font-extrabold text-ink lg:text-4xl">
          {name ? `Selamat datang, ${name}!` : 'Selamat datang!'}
        </h1>
        <p className="text-muted">
          {next
            ? `Hari ke-${next} dari ${TOTAL_DAYS} sudah menunggumu. Dua jam setiap pagi sudah cukup untuk hari ini.`
            : 'Kamu sudah menyelesaikan seluruh 90 hari. Ulangi bagian yang masih lemah lewat Buku Kesalahan.'}
        </p>
        <p className="text-sm text-muted">Akunmu tersimpan di perangkat ini. Belum tersinkron ke server.</p>
      </div>

      <Button size="lg" className="w-full" onClick={() => navigate('/', { replace: true })}>
        {firstTime ? 'Mulai belajar' : 'Lanjutkan'}
        <ArrowRight size={20} aria-hidden="true" />
      </Button>
    </AuthFrame>
  );
}
