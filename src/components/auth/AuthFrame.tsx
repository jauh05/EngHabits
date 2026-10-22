import type { ReactNode } from 'react';
import { Blob } from '../ui/Blob';

/**
 * Kerangka layar mulai, daftar, masuk, dan sambutan, pola kartu seperti contoh gambar 30:
 * bagian atas berwarna dengan lingkaran lembut dan ilustrasi, bagian bawah lembar putih dengan sudut besar.
 * Selalu selebar HP. Di desktop berbentuk kartu ponsel dengan tinggi mengikuti layar.
 */
export function AuthFrame({ art, children }: { art: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center bg-surface p-3 sm:items-center sm:p-4">
      <div className="relative flex w-full max-w-[390px] flex-col overflow-hidden rounded-[40px] shadow-card sm:h-[min(844px,calc(100dvh-2rem))]">
        <section className="isolate relative flex min-h-[38dvh] flex-none items-center justify-center overflow-hidden bg-banner px-6 pb-8 pt-5 sm:min-h-0 sm:pb-6 sm:pt-4">
          <Blob className="-left-14 -top-12 size-48 bg-tint-sun/90" />
          <Blob className="-right-16 top-6 size-44 bg-lime/70" />
          <Blob className="-bottom-16 right-4 size-36 bg-tint-mint/80" />
          <div className="relative flex w-full max-w-sm flex-col items-center">{art}</div>
        </section>
        <section className="relative -mt-6 flex min-h-0 flex-1 flex-col gap-3 rounded-t-[36px] bg-surface px-6 pb-6 pt-6 sm:gap-2.5 sm:pb-3 sm:pt-5 sm:overflow-y-auto">
          {children}
        </section>
      </div>
    </div>
  );
}
