import type { ReactNode } from 'react';
import { BackgroundArt } from '../ui/BackgroundArt';

/**
 * Kerangka layar mulai, daftar, dan masuk. Pola gambar 1 dan 2: bagian atas berwarna dengan karakter,
 * bagian bawah lembar putih melengkung. Selalu selebar HP, juga di desktop, dan ditaruh di tengah
 * seperti kartu ponsel di atas latar lime.
 */
export function AuthFrame({ art, children }: { art: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center bg-bg lg:py-10">
      <div className="relative flex w-full max-w-md flex-col overflow-hidden lg:rounded-[40px] lg:shadow-card">
        <section className="isolate relative flex min-h-[44dvh] items-center justify-center overflow-hidden bg-linear-to-b from-lime via-primary-100 to-bg px-6 py-10">
          <BackgroundArt />
          <div className="relative flex w-full max-w-sm flex-col items-center">{art}</div>
        </section>
        <section className="relative -mt-8 flex flex-1 flex-col gap-6 rounded-t-[36px] bg-surface px-6 pb-10 pt-8 shadow-card">
          {children}
        </section>
      </div>
    </div>
  );
}

/** Kotak berwarna dengan isi di tengah, untuk slide mulai. */
export function ArtTile({ tint, children }: { tint: string; children: ReactNode }) {
  return (
    <div className={`relative grid size-56 place-items-center rounded-[40px] shadow-card sm:size-64 ${tint}`}>
      <div className="grid size-28 place-items-center rounded-[32px] bg-surface/80 text-ink sm:size-32">{children}</div>
    </div>
  );
}
