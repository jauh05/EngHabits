import { useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { AuthFrame } from '../components/auth/AuthFrame';
import { SocialButtons } from '../components/auth/SocialButtons';
import { BlobCluster } from '../components/ui/BlobCluster';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { createAccount, PASSWORD_MIN_LENGTH, validateRegistration } from '../lib/auth';
import { useSettings } from '../lib/settings';

/** Daftar akun lokal. Hanya satu akun per perangkat, karena belum ada server. */
export function DaftarPage() {
  const { settings, update } = useSettings();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(undefined);
    if (settings.account) {
      setError('Akun sudah ada di perangkat ini. Silakan masuk.');
      return;
    }
    const problem = validateRegistration({ name, email, password });
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    try {
      const account = await createAccount({ name, email, password });
      update({ account, name: account.name, signedIn: true });
      navigate('/sambutan', { replace: true, state: { welcome: true } });
    } catch {
      setError('Akun gagal dibuat. Coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame art={<BlobCluster bubble="Yay!" className="w-72 sm:w-80" />}>
      <div className="flex flex-col gap-2 text-center lg:text-left">
        <h1 className="text-3xl font-extrabold text-ink lg:text-4xl">Buat akun</h1>
        <p className="text-muted">Akun disimpan di perangkat ini. Belum tersinkron ke server.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Nama panggilan"
          name="nama"
          autoComplete="given-name"
          maxLength={40}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Misalnya Sinta"
        />
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
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={`Minimal ${PASSWORD_MIN_LENGTH} karakter`}
        />
        {error && (
          <p role="alert" className="rounded-2xl bg-error/15 px-4 py-3 text-sm font-semibold text-ink">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? 'Membuat akun…' : 'Daftar dan mulai'}
          <ArrowRight size={20} aria-hidden="true" />
        </Button>
      </form>

      <SocialButtons />

      <p className="text-center text-sm text-muted">
        Sudah punya akun?{' '}
        <Link to="/masuk" className="font-semibold text-primary-700 underline underline-offset-4">
          Masuk
        </Link>
      </p>
    </AuthFrame>
  );
}
