import { useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { ArtTile, AuthFrame } from '../components/auth/AuthFrame';
import { SocialButtons } from '../components/auth/SocialButtons';
import { StackIllustration } from '../components/ui/Illustration';
import { Button } from '../components/ui/Button';
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
    <AuthFrame art={<ArtTile tint="bg-tint-sky"><StackIllustration className="w-20 sm:w-24" /></ArtTile>}>
      <div className="flex flex-col gap-2 text-center lg:text-left">
        <h1 className="text-3xl font-extrabold text-ink lg:text-4xl">Masuk</h1>
        <p className="text-muted">Lanjutkan kebiasaanmu dari perangkat ini.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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

      <p className="text-center text-sm text-muted">
        Belum punya akun?{' '}
        <Link to="/daftar" className="font-semibold text-primary-700 underline underline-offset-4">
          Daftar
        </Link>
      </p>
    </AuthFrame>
  );
}
