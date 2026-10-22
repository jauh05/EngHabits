import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { AuthFrame } from '../components/auth/AuthFrame';
import { BlobCluster } from '../components/ui/BlobCluster';
import { Button } from '../components/ui/Button';
import { currentDay, TOTAL_DAYS } from '../lib/progression';
import { useSettings } from '../lib/settings';
import { useProgressData } from '../lib/useProgressData';

/** Layar sambutan setelah masuk atau daftar. Pola judul dua baris seperti gambar 2 (Readly). */
export function SambutanPage() {
  const { settings } = useSettings();
  const data = useProgressData();
  const navigate = useNavigate();
  const name = settings.name.trim() || 'kamu';
  const next = currentDay(data.mastered);
  const firstTime = data.mastered.size === 0;

  return (
    <AuthFrame art={<BlobCluster className="w-48 sm:w-44" />}>
      <div className="flex flex-col gap-3 text-center lg:text-left">
        <h1 className="text-4xl font-extrabold leading-tight text-ink lg:text-5xl">
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
    </AuthFrame>
  );
}
