import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Card } from '../components/ui/Card';
import { buttonClass } from '../components/ui/Button';
import { exchangeKauizSession } from '../lib/kauiz';
import { useSettings } from '../lib/settings';

/** Halaman tujuan setelah Kauiz mengirim kembali pengguna. Kode serah-terima ditukar menjadi sesi EngHabits. */
export function KauizSessionPage() {
  const [params] = useSearchParams();
  const { update } = useSettings();
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  // Kode hanya bisa dipakai sekali, jadi penukaran jalan tepat sekali walaupun efek dijalankan dua kali.
  const started = useRef(false);
  const code = params.get('code') ?? '';

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!code) {
      setError('Sesi masuk Kauiz tidak ditemukan. Coba masuk lagi.');
      return;
    }
    exchangeKauizSession(code)
      .then((session) => {
        update({ account: session.account, name: session.account.name, token: session.token, signedIn: true });
        navigate('/sambutan', { replace: true, state: { welcome: true } });
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Masuk dengan Kauiz gagal. Coba lagi.'));
  }, [code, navigate, update]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        {error ? (
          <>
            <p role="alert" className="font-bold text-ink">
              {error}
            </p>
            <Link to="/masuk" className={buttonClass('primary', 'md')}>
              Kembali ke masuk
            </Link>
          </>
        ) : (
          <p className="font-bold text-ink">Menyelesaikan masuk dengan Kauiz…</p>
        )}
      </Card>
    </div>
  );
}
