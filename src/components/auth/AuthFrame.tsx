import type { ReactNode } from 'react';
import { BackgroundArt } from '../ui/BackgroundArt';

/**
 * Kerangka layar mulai, daftar, masuk, dan sambutan. Pola gambar 1 dan 2: bagian atas berwarna dengan ilustrasi,
 * bagian bawah lembar putih melengkung. Selalu selebar HP. Di desktop berbentuk kartu ponsel dengan tinggi
 * mengikuti layar, dan bagian bawah bisa digulir di dalam kartu agar tombol tetap terjangkau.
 */
export function AuthFrame({ art, children }: { art: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center bg-bg lg:items-center lg:py-6">
      <div className="relative flex w-full max-w-md flex-col overflow-hidden lg:h-[min(844px,calc(100dvh-3rem))] lg:max-w-[390px] lg:rounded-[44px] lg:shadow-card">
        <section className="isolate relative flex min-h-[38dvh] flex-none items-center justify-center overflow-hidden bg-linear-to-b from-lime via-primary-100 to-bg px-6 pb-10 pt-6 sm:min-h-[42dvh]">
          <BackgroundArt variant="auth" />
          <div className="relative flex w-full max-w-sm flex-col items-center">{art}</div>
        </section>
        <section className="relative -mt-6 flex min-h-0 flex-1 flex-col gap-4 rounded-t-[36px] bg-surface px-6 pb-8 pt-7 shadow-card lg:overflow-y-auto">
          {children}
        </section>
      </div>
    </div>
  );
}
