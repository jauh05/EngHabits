import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { BackgroundArt } from '../components/ui/BackgroundArt';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { currentDay, TOTAL_DAYS } from '../lib/progression';
import { useSettings } from '../lib/settings';
import { useProgressData } from '../lib/useProgressData';

/**
 * Layar sambutan setelah masuk atau daftar. Latarnya sama dengan dashboard: hijau dengan bentuk 3D,
 * dan isinya berada di kartu bayangan seperti kartu di beranda.
 */
export function SambutanPage() {
  const { settings } = useSettings();
  const data = useProgressData();
  const navigate = useNavigate();
  const name = settings.name.trim() || 'kamu';
  const next = currentDay(data.mastered);
  const firstTime = data.mastered.size === 0;

  return (
    <div className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-bg p-4">
      <BackgroundArt />
      <Card className="relative flex w-full max-w-md flex-col items-center gap-6 p-6 text-center sm:p-8">
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="Logo EngHabits"
          width={144}
          height={144}
          className="h-36 w-auto"
        />
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-extrabold leading-tight text-ink">
            Selamat datang,
            <br />
            <span className="text-primary-700">{name}!</span>
          </h1>
          <p className="text-base text-muted">
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
      </Card>
    </div>
  );
}
