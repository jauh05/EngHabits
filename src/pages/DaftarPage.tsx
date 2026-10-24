import { useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { AuthFrame } from '../components/auth/AuthFrame';
import { SocialButtons } from '../components/auth/SocialButtons';
import { Logo } from '../components/ui/Logo';
import { Button, buttonClass } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PASSWORD_MIN_LENGTH, registerAccount, validateRegistration } from '../lib/auth';
import { useSettings } from '../lib/settings';

/** Daftar akun lokal. Hanya satu akun per perangkat, karena belum ada server. */
export function DaftarPage() {
  const { update } = useSettings();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(undefined);
    const problem = validateRegistration({ name, email, password });
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    try {
      const session = await registerAccount({ name, email, password });
      update({ account: session.account, name: session.account.name, token: session.token, signedIn: true });
      navigate('/sambutan', { replace: true, state: { welcome: true } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Akun gagal dibuat. Coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame
      art={
        <span className="grid place-items-center rounded-full bg-surface/90 p-3 shadow-card">
          <Logo className="h-28 w-auto sm:h-24" />
        </span>
      }
    >
      <div className="flex flex-col gap-2 text-center lg:text-left">
        <h1 className="text-3xl font-extrabold text-ink">Buat akun</h1>
        <p className="text-muted">Akunmu disimpan di server, jadi bisa dipakai dari perangkat mana pun.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-2.5" noValidate>
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

      <div className="flex items-center justify-between gap-3 text-sm text-muted">
        <p>Sudah punya akun?</p>
        <Link to="/masuk" className={buttonClass('secondary', 'md', 'hover:scale-[1.02]')}>
          Masuk
        </Link>
      </div>
    </AuthFrame>
  );
}
