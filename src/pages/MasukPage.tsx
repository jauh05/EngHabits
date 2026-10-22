import { useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { AuthFrame } from '../components/auth/AuthFrame';
import { SocialButtons } from '../components/auth/SocialButtons';
import { BlobCluster } from '../components/ui/BlobCluster';
import { Button, buttonClass } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { checkCredentials } from '../lib/auth';
import { useSettings } from '../lib/settings';

/** Masuk ke akun lokal di perangkat ini. */
export function MasukPage() {
  const { settings, update } = useSettings();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const account = settings.account;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(undefined);
    if (!account) {
      setError('Belum ada akun di perangkat ini. Daftar dulu.');
      return;
    }
    setBusy(true);
    try {
      const ok = await checkCredentials(account, email, password);
      if (!ok) {
        setError('Email atau kata sandi salah.');
        return;
      }
      update({ name: account.name, signedIn: true });
      navigate('/sambutan', { replace: true, state: { welcome: true } });
    } catch {
      setError('Masuk gagal. Coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame
      art={
        <div className="flex flex-col items-center gap-2">
          <p className="text-4xl font-black tracking-tight text-white">EngHabits</p>
          <BlobCluster bubble="Hello~" className="w-48 sm:w-44" />
        </div>
      }
    >
      <div className="flex flex-col gap-2 text-center lg:text-left">
        <h1 className="text-3xl font-extrabold text-ink">Masuk untuk mulai</h1>
        <p className="text-muted">Lanjutkan kebiasaanmu dari perangkat ini.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-2.5" noValidate>
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nama@contoh.id"
        />
        <Input
          label="Kata sandi"
          name="kata-sandi"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && (
          <p role="alert" className="rounded-2xl bg-error/15 px-4 py-3 text-sm font-semibold text-ink">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? 'Memeriksa…' : 'Masuk'}
          <ArrowRight size={20} aria-hidden="true" />
        </Button>
      </form>

      <SocialButtons />

      <div className="flex items-center justify-between gap-3 text-sm text-muted">
        <p>Belum punya akun?</p>
        <Link to="/daftar" className={buttonClass('secondary', 'md', 'hover:scale-[1.02]')}>
          Daftar
        </Link>
      </div>
    </AuthFrame>
  );
}
