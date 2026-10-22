import type { ReactNode } from 'react';
import { Blob } from '../ui/Blob';

/**
 * Kerangka layar mulai, daftar, dan masuk. Pola gambar 1 dan 2: bagian atas berwarna dengan karakter,
 * bagian bawah lembar putih melengkung. HP: atas di atas, bawah di bawah. Desktop: dua kolom berdampingan.
 */
export function AuthFrame({ art, children }: { art: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg lg:flex-row">
      <section className="relative flex min-h-[44dvh] items-center justify-center overflow-hidden bg-linear-to-b from-tint-sky via-tint-lilac to-tint-sky px-6 py-10 lg:min-h-dvh lg:flex-1 lg:px-16">
        <Blob className="-right-16 -top-16 size-64 bg-white/60" />
        <Blob className="-left-10 bottom-10 size-40 bg-tint-peach/70" />
        <div className="relative flex w-full max-w-sm flex-col items-center">{art}</div>
      </section>
      <section className="relative -mt-8 flex flex-1 flex-col gap-6 rounded-t-[36px] bg-surface px-6 pb-10 pt-8 shadow-card lg:mt-0 lg:min-h-dvh lg:max-w-lg lg:justify-center lg:rounded-none lg:px-14 lg:shadow-none">
        {children}
      </section>
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
