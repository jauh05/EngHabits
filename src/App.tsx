import type { ReactNode } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router';
import { useSettings } from './lib/settings';
import { AppShell } from './components/layout/AppShell';
import { BankSessionPage } from './pages/BankSessionPage';
import { BattlePage } from './pages/BattlePage';
import { BattleRoomPage } from './pages/BattleRoomPage';
import { DashboardPage } from './pages/DashboardPage';
import { DaftarPage } from './pages/DaftarPage';
import { DayPage } from './pages/DayPage';
import { MapPage } from './pages/MapPage';
import { MasukPage } from './pages/MasukPage';
import { MistakesPage } from './pages/MistakesPage';
import { MulaiPage } from './pages/MulaiPage';
import { ProfilePage } from './pages/ProfilePage';
import { PracticePage } from './pages/PracticePage';
import { ReadinessPage } from './pages/ReadinessPage';
import { SambutanPage } from './pages/SambutanPage';
import { StatsPage } from './pages/StatsPage';

/** Halaman yang boleh dibuka tanpa masuk. */
const PUBLIC_PATHS = ['/mulai', '/masuk', '/daftar'];

function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold text-ink">Halaman tidak ditemukan</h1>
      <Link to="/" className="inline-flex min-h-11 items-center rounded-full bg-btn-bg px-6 font-semibold text-btn-fg">
        Ke beranda
      </Link>
    </div>
  );
}

/**
 * Pengguna yang belum masuk hanya boleh membuka halaman publik. Tanpa akun diarahkan ke /mulai,
 * dengan akun ke /masuk. Yang sudah masuk tidak perlu melihat halaman publik lagi.
 * Menunggu pengaturan termuat dulu, supaya tidak ada kilasan halaman sebelum pengalihan.
 */
function AuthGate({ children }: { children: ReactNode }) {
  const { settings, loaded } = useSettings();
  const { pathname, state } = useLocation();
  if (!loaded) return null;
  const isPublic = PUBLIC_PATHS.includes(pathname);
  // Sambutan dibuka tepat setelah daftar atau masuk. Statusnya bisa belum terbaca saat navigasi, jadi ditandai lewat state.
  const fromAuth = pathname === '/sambutan' && Boolean((state as { welcome?: boolean } | null)?.welcome);
  if (!settings.signedIn) {
    if (isPublic || fromAuth) return <>{children}</>;
    return <Navigate to={settings.account ? '/masuk' : '/mulai'} replace />;
  }
  // Halaman publik tidak dialihkan saat sudah masuk. Alihkan di sana akan berbenturan dengan navigasi ke sambutan.
  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthGate>
        <Routes>
          <Route path="mulai" element={<MulaiPage />} />
          <Route path="masuk" element={<MasukPage />} />
          <Route path="daftar" element={<DaftarPage />} />
          <Route path="sambutan" element={<SambutanPage />} />
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="peta" element={<MapPage />} />
            <Route path="kesalahan" element={<MistakesPage />} />
            <Route path="statistik" element={<StatsPage />} />
            <Route path="laporan" element={<ReadinessPage />} />
            <Route path="latihan" element={<PracticePage />} />
            <Route path="latihan/bank/:week" element={<BankSessionPage />} />
            <Route path="battle" element={<BattlePage />} />
            <Route path="battle/:id" element={<BattleRoomPage />} />
            <Route path="profil" element={<ProfilePage />} />
          </Route>
          <Route path="hari/:n" element={<DayPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthGate>
    </BrowserRouter>
  );
}
