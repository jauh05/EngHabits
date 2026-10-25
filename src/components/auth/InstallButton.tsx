import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { canPromptInstall, currentInstallPlatform, promptInstall, subscribeInstall, type InstallPlatform } from '../../lib/install';
import { Button, buttonClass } from '../ui/Button';
import { Modal } from '../ui/Modal';

const STEPS: Record<Exclude<InstallPlatform, 'installed'>, string> = {
  ios: 'Buka EngHabits di Safari. Ketuk tombol Bagikan (kotak dengan panah ke atas), lalu pilih Tambahkan ke Layar Utama.',
  other:
    'Di Chrome atau Edge, klik ikon pasang (⊕) di kolom alamat, atau buka menu ⋮ lalu pilih Pasang aplikasi. Di Android, pilih Tambahkan ke layar utama. Di Safari Mac, pilih File lalu Tambahkan ke Dock.',
};

/**
 * Tombol untuk memasang EngHabits seperti aplikasi. Kalau browser memberi dialog pasang, dialog itu langsung dibuka.
 * Kalau tidak, tombol membuka petunjuk sesuai perangkat. Tombol hilang kalau aplikasi sudah terpasang.
 */
export function InstallButton() {
  const [platform, setPlatform] = useState<InstallPlatform>('other');
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setPlatform(currentInstallPlatform());
    setReady(canPromptInstall());
    return subscribeInstall(() => setReady(canPromptInstall()));
  }, []);

  if (platform === 'installed') return null;

  const handleClick = async () => {
    if (ready) {
      await promptInstall();
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button type="button" onClick={handleClick} className={buttonClass('secondary', 'md', 'w-full')}>
        <Download size={18} aria-hidden="true" />
        Pasang aplikasi
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Pasang EngHabits">
        <p className="text-sm text-muted">{STEPS[platform === 'ios' ? 'ios' : 'other']}</p>
        <div className="mt-6 flex justify-end">
          <Button onClick={() => setOpen(false)}>Mengerti</Button>
        </div>
      </Modal>
    </>
  );
}
