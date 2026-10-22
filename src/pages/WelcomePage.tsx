import { useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Blob } from '../components/ui/Blob';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StackIllustration } from '../components/ui/Illustration';
import { useSettings } from '../lib/settings';

/**
 * Layar awal, pola seperti Quivio: bagian atas ungu terang dengan ilustrasi dan balon teks,
 * bagian bawah putih berisi ajakan dan tombol mulai.
 * Ini bukan login. Aplikasi tidak punya akun. Nama hanya disimpan di perangkat ini.
 */
export function WelcomePage() {
  const { update } = useSettings();
  const navigate = useNavigate();
  const [name, setName] = useState('');

  const finish = (withName: boolean) => {
    update({ onboarded: true, name: withName ? name.trim() : '' });
    navigate('/', { replace: true });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    finish(true);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-bg lg:items-center lg:justify-center lg:py-10">
      <div className="flex w-full flex-col lg:max-w-md lg:overflow-hidden lg:rounded-[32px] lg:shadow-card">
        <section className="relative flex min-h-[52dvh] flex-col overflow-hidden bg-primary-100 px-6 pb-14 pt-6">
          <Blob className="-right-16 -top-16 size-64 bg-white/60" />
          <Blob className="-left-10 bottom-10 size-40 bg-white/40" />

          <header className="relative flex items-center justify-between">
            <p className="text-xl font-extrabold text-primary-700">EngHabits</p>
            <button
              type="button"
              onClick={() => finish(false)}
              className="min-h-11 rounded-full px-3 font-semibold text-primary-700 outline-none focus-visible:outline-2 focus-visible:outline-primary-500"
            >
              Lewati
            </button>
          </header>

          <div className="relative mx-auto mt-4 flex w-full max-w-xs flex-col items-center">
            <StackIllustration className="w-44 sm:w-52" />
            <div className="relative -mt-6 w-full rounded-[28px] bg-banner p-5 text-ink shadow-card">
              <h2 className="text-2xl font-extrabold leading-tight">Belajar Inggris Setiap Pagi</h2>
              <p className="mt-2 text-sm leading-relaxed">
                2 jam sehari selama 90 hari. Materi, latihan, dan soal dibuat untuk kebiasaan jangka panjang.
              </p>
              <span aria-hidden="true" className="absolute -bottom-2 left-1/2 size-4 -translate-x-1/2 rotate-45 bg-banner" />
            </div>
          </div>
        </section>

        <section className="relative -mt-10 flex flex-1 flex-col gap-6 rounded-t-[32px] bg-surface px-6 pb-8 pt-8 shadow-card">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-ink">Mulai kebiasaanmu</h1>
            <p className="mt-2 text-muted">Masukkan nama panggilan agar sapaan di beranda terasa pribadi.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="Nama panggilan (opsional)"
              name="nama"
              autoComplete="given-name"
              maxLength={40}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Misalnya Sinta"
              hint="Nama hanya disimpan di perangkat ini. Tidak ada akun atau kata sandi."
            />
            <Button type="submit" size="lg" className="w-full">
              Mulai belajar
              <ArrowRight size={20} aria-hidden="true" />
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
